export interface RealtimeTranscript {
  text: string
  speaker: string
  timestamp: number
  confidence: number
  startTime: number
  endTime: number
}

export interface RealtimeInsight {
  id: string
  type: 'pass' | 'fail' | 'warning' | 'info'
  criterion: string
  criterionId: string
  category: string
  message: string
  timestamp: number
  autoFail: boolean
  ztp: boolean
}

export interface LiveCallState {
  isConnected: boolean
  isRecording: boolean
  duration: number
  transcript: RealtimeTranscript[]
  insights: RealtimeInsight[]
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  criteriaStatus: Record<string, { pass: boolean; triggered: boolean }>
  score: number
  callerName?: string
  callerPhone?: string
  callerLocation?: string
  insurance?: string
  sobrietyTime?: string
  substance?: string
  sessionId?: string
  audioDuration?: number
}

const RUBRIC_KEYWORDS: Record<string, { pass: string[]; fail: string[]; category: string; autoFail: boolean; ztp: boolean }> = {
  '1.1': { pass: ['hello flyland', 'flyland this is'], fail: ['hi there', 'flyland help line'], category: 'Opening', autoFail: false, ztp: false },
  '1.2': { pass: ["what's your name", 'can i get your name', 'may i have your name'], fail: [], category: 'Opening', autoFail: false, ztp: false },
  '1.3': { pass: ['how can i help', 'what brings you', 'reason for your call'], fail: ['assumed reason'], category: 'Opening', autoFail: false, ztp: false },
  '1.4': { pass: ['what state', 'which state', 'state are you'], fail: [], category: 'Opening', autoFail: false, ztp: false },
  '2.1': { pass: ['last drink', 'last drug use', 'when was your last'], fail: ['how long sober'], category: 'Probing', autoFail: false, ztp: false },
  '2.2': { pass: ['what substance', 'struggling with', 'alcohol drugs'], fail: ['detox advice'], category: 'Probing', autoFail: false, ztp: false },
  '2.3': { pass: ['type of insurance', 'private or state', 'medicaid', 'medicare'], fail: ['do you have insurance'], category: 'Probing', autoFail: false, ztp: false },
  '2.4': { pass: ['openness to help', 'facility name'], fail: ['repeated questions'], category: 'Probing', autoFail: false, ztp: false },
  '2.5': { pass: ['best number', 'phone number', 'reach you'], fail: [], category: 'Probing', autoFail: false, ztp: false },
  '3.4': { pass: [], fail: ['transfer state insurance', 'transfer self-pay', 'transfer out-of-state'], category: 'Qualification', autoFail: true, ztp: true },
  '3.7': { pass: ['i understand', 'thank you for', "that's understandable"], fail: ['irritation', 'dismissive'], category: 'Qualification', autoFail: false, ztp: false },
  '5.1': { pass: ['hipaa', 'confidential'], fail: ['shares info unauthorized'], category: 'Compliance', autoFail: true, ztp: true },
  '5.2': { pass: ['i cannot advise', 'not a medical'], fail: ['detox advice', 'withdrawal advice', 'treatment recommendation'], category: 'Compliance', autoFail: true, ztp: true },
}

const INSURANCE_PATTERNS = [
  { pattern: /medicaid/i, value: 'medicaid' },
  { pattern: /medicare/i, value: 'medicare' },
  { pattern: /tricare/i, value: 'tricare' },
  { pattern: /kaiser/i, value: 'kaiser' },
  { pattern: /private|brown|blue cross|aetna|cigna|united/i, value: 'private' },
  { pattern: /self.pay|self pay/i, value: 'self-pay' },
]

const STATE_PATTERNS = /\b(alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming)\b/i

const NAME_PATTERNS = [
  /(?:my name is|I'm|this is|name's|they call me)\s+([A-Z][a-z]+)/i,
  /(?:caller|calling)\s+([A-Z][a-z]+)/i,
]

interface AAIRealtimeMessage {
  type: string
  [key: string]: unknown
}

export class AssemblyAIRealtime {
  private ws: WebSocket | null = null
  private mediaStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private microphone: MediaStreamAudioSourceNode | null = null
  private processor: ScriptProcessorNode | null = null
  private sampleRate = 16000
  private onTranscript: (t: RealtimeTranscript) => void
  private onInsight: (i: RealtimeInsight) => void
  private onStateChange: (s: Partial<LiveCallState>) => void
  private onError: (e: Error) => void
  private onClose: () => void
  private state: Partial<LiveCallState> = {}
  private startTime = 0
  private turnCount = 0
  private lastSpeaker = ''
  private apiKey: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private isManualStop = false
  private isReconnecting = false
  private bufferQueue: Int16Array[] = []
  private sessionBegun = false

  constructor(opts: {
    apiKey: string
    onTranscript: (t: RealtimeTranscript) => void
    onInsight: (i: RealtimeInsight) => void
    onStateChange: (s: Partial<LiveCallState>) => void
    onError: (e: Error) => void
    onClose: () => void
  }) {
    this.apiKey = opts.apiKey
    this.onTranscript = opts.onTranscript
    this.onInsight = opts.onInsight
    this.onStateChange = opts.onStateChange
    this.onError = opts.onError
    this.onClose = opts.onClose
  }

  async connect(callId?: string): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        }
      })

      this.audioContext = new AudioContext({ sampleRate: 48000 })
      this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream)

      const bufferSize = 4096
      this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1)

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)
        const downsampled = this.downsample(inputData, 48000, this.sampleRate)
        if (this.ws?.readyState === WebSocket.OPEN) {
          const int16Array = this.toInt16Array(downsampled)
          this.ws.send(int16Array)
        }
      }

      this.microphone.connect(this.processor)
      this.processor.connect(this.audioContext.destination)

      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=${this.sampleRate}&speech_model=u3-rt-pro`
      this.ws = new WebSocket(wsUrl)
      this.ws.binaryType = 'arraybuffer'

      this.ws.onopen = () => {
        this.startTime = Date.now()
        this.reconnectAttempts = 0
        this.sessionBegun = false
        this.onStateChange({ isConnected: true, isRecording: true, duration: 0 })
        if (callId) {
          this.onStateChange({ callerPhone: callId })
        }
        this.flushBufferQueue()
      }

      this.ws.onmessage = (event) => {
        try {
          let data: AAIRealtimeMessage
          if (typeof event.data === 'string') {
            data = JSON.parse(event.data)
          } else {
            const text = new TextDecoder().decode(event.data as ArrayBuffer)
            data = JSON.parse(text)
          }
          this.handleMessage(data)
        } catch (err) {
          console.warn('Failed to parse AssemblyAI message:', err)
        }
      }

      this.ws.onerror = () => {
        if (!this.isManualStop && !this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          console.warn(`AssemblyAI WebSocket error, reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
          this.isReconnecting = true
          setTimeout(() => {
            this.isReconnecting = false
            if (!this.isManualStop) {
              this.attemptReconnect(callId)
            }
          }, 2000 * this.reconnectAttempts)
        } else if (!this.isManualStop) {
          this.onError(new Error('AssemblyAI WebSocket connection failed. Check your API key and internet connection.'))
        }
      }

      this.ws.onclose = (event) => {
        if (!this.isManualStop) {
          this.onClose()
        }
      }

    } catch (err) {
      this.onError(err instanceof Error ? err : new Error('Failed to access microphone'))
    }
  }

  private attemptReconnect(callId?: string): void {
    if (this.isManualStop || this.ws) return
    try {
      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=${this.sampleRate}&speech_model=u3-rt-pro`
      this.ws = new WebSocket(wsUrl)
      this.ws.binaryType = 'arraybuffer'

      this.ws.onopen = () => {
        this.startTime = Date.now()
        this.sessionBegun = false
        this.onStateChange({ isConnected: true, isRecording: true })
        this.flushBufferQueue()
      }

      this.ws.onmessage = (event) => {
        try {
          let data: AAIRealtimeMessage
          if (typeof event.data === 'string') {
            data = JSON.parse(event.data)
          } else {
            const text = new TextDecoder().decode(event.data as ArrayBuffer)
            data = JSON.parse(text)
          }
          this.handleMessage(data)
        } catch (err) {
          console.warn('Failed to parse message:', err)
        }
      }

      this.ws.onerror = () => {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.onError(new Error('AssemblyAI WebSocket reconnect failed'))
        }
      }

      this.ws.onclose = () => {
        if (!this.isManualStop) {
          this.onClose()
        }
      }
    } catch {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.onError(new Error('AssemblyAI WebSocket reconnect failed'))
      }
    }
  }

  private flushBufferQueue(): void {
    for (const buffer of this.bufferQueue) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(buffer)
      }
    }
    this.bufferQueue = []
  }

  private handleMessage(data: AAIRealtimeMessage): void {
    const msgType = data.type

    if (msgType === 'Begin') {
      this.sessionBegun = true
      const sessionId = data.id as string | undefined
      this.onStateChange({ sessionId })
      return
    }

    if (msgType === 'Turn') {
      const transcriptText = (data.transcript as string | undefined)?.trim()
      const isFormatted = (data.turn_is_formatted as boolean | undefined) ?? false

      if (!transcriptText) return

      this.turnCount++
      const speaker = this.detectSpeaker(transcriptText)
      const now = Date.now()
      const elapsed = Math.round((now - this.startTime) / 1000)

      const transcript: RealtimeTranscript = {
        text: transcriptText,
        speaker,
        timestamp: now,
        confidence: 1,
        startTime: elapsed - Math.round(transcriptText.split(' ').length * 0.4),
        endTime: elapsed,
      }

      this.onTranscript(transcript)
      this.analyzeText(transcriptText, speaker, elapsed)
      this.onStateChange({ transcript: [...(this.state.transcript || []), transcript] })
      return
    }

    if (msgType === 'PartialTurn') {
      const partialText = (data.transcript as string | undefined)?.trim()
      if (!partialText) return
      return
    }

    if (msgType === 'Termination') {
      const audioDuration = (data.audio_duration_seconds as number | undefined) ?? 0
      const sessionDuration = (data.session_duration_seconds as number | undefined) ?? 0
      this.onStateChange({
        audioDuration,
        isConnected: false,
        isRecording: false,
      })
      return
    }

    if (msgType === 'SessionBegins') {
      return
    }
  }

  private detectSpeaker(text: string): string {
    const lower = text.toLowerCase()
    
    if (lower.includes('flyland') || lower.includes('thank you for calling') || 
        lower.includes('my name is') || lower.includes('this is ') ||
        lower.includes('how can i help') || lower.includes('what can i do for you') ||
        lower.includes('hi ') || lower.includes('hello ')) {
      return 'Agent'
    }
    
    if (lower.includes('i need') || lower.includes('i am') || lower.includes("i'm") ||
        lower.includes('i was') || lower.includes('my husband') || lower.includes('my son') ||
        lower.includes('my daughter') || lower.includes('my mom') || lower.includes('my dad')) {
      return 'Caller'
    }

    this.turnCount++
    const speaker = this.turnCount % 2 === 1 ? 'Agent' : 'Caller'
    return speaker
  }

  private analyzeText(text: string, speaker: string, elapsed: number): void {
    const lower = text.toLowerCase()

    if (speaker === 'Agent') {
      for (const [id, config] of Object.entries(RUBRIC_KEYWORDS)) {
        const criteria = this.state.criteriaStatus?.[id]
        if (criteria?.triggered) continue

        const passFound = config.pass.some(p => lower.includes(p.toLowerCase()))
        const failFound = config.fail.some(p => lower.includes(p.toLowerCase()))

        if (passFound || failFound) {
          const pass = !failFound && passFound

          this.onInsight({
            id: `${id}-${elapsed}`,
            type: failFound ? (config.autoFail ? 'fail' : 'warning') : 'pass',
            criterion: this.getCriterionName(id),
            criterionId: id,
            category: config.category,
            message: pass
              ? `Agent: "${text.substring(0, 80)}..."`
              : `${failFound ? 'FAILED' : 'Triggered'}: "${text.substring(0, 80)}..."`,
            timestamp: elapsed,
            autoFail: config.autoFail,
            ztp: config.ztp,
          })

          this.state.criteriaStatus = {
            ...this.state.criteriaStatus,
            [id]: { pass, triggered: true },
          }

          this.recalculateScore()
          this.onStateChange({ criteriaStatus: { ...this.state.criteriaStatus }, score: this.state.score })
        }
      }

      if (elapsed > 30 && !this.state.criteriaStatus?.['1.3']?.triggered) {
        this.onInsight({
          id: `timeout-${elapsed}`,
          type: 'warning',
          criterion: 'Opening - Promptness',
          criterionId: '1.3',
          category: 'Opening',
          message: 'Over 30 seconds without identifying reason for call',
          timestamp: elapsed,
          autoFail: false,
          ztp: false,
        })
        this.state.criteriaStatus = {
          ...this.state.criteriaStatus,
          '1.3': { pass: false, triggered: true },
        }
        this.recalculateScore()
      }
    }

    if (INSURANCE_PATTERNS.some(ip => ip.pattern.test(lower)) && !this.state.insurance) {
      const found = INSURANCE_PATTERNS.find(ip => ip.pattern.test(lower))
      this.state.insurance = found?.value
      this.onStateChange({ insurance: found?.value })
      this.onInsight({
        id: `insurance-${elapsed}`,
        type: 'info',
        criterion: 'Insurance Detected',
        criterionId: '2.3',
        category: 'Probing',
        message: `Detected insurance type: ${found?.value}`,
        timestamp: elapsed,
        autoFail: false,
        ztp: false,
      })
    }

    const stateMatch = lower.match(STATE_PATTERNS)
    if (stateMatch && !this.state.callerLocation) {
      this.state.callerLocation = stateMatch[1]
      this.onStateChange({ callerLocation: stateMatch[1] })
    }

    const nameMatch = NAME_PATTERNS.some(p => p.test(text))
    if (nameMatch && speaker === 'Caller' && !this.state.callerName) {
      for (const pattern of NAME_PATTERNS) {
        const match = text.match(pattern)
        if (match?.[1]) {
          this.state.callerName = match[1]
          this.onStateChange({ callerName: match[1] })
          break
        }
      }
    }

    const sentiment = this.detectSentiment(lower)
    this.onStateChange({ sentiment, sentimentScore: sentiment === 'positive' ? 70 : sentiment === 'neutral' ? 50 : 30 })
  }

  private detectSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positive = ['thank you', 'appreciate', 'helpful', 'great', 'perfect', 'wonderful']
    const negative = ['frustrated', 'angry', 'upset', 'disappointed', 'terrible', 'worst']

    const posCount = positive.filter(w => text.includes(w)).length
    const negCount = negative.filter(w => text.includes(w)).length

    if (posCount > negCount) return 'positive'
    if (negCount > posCount) return 'negative'
    return 'neutral'
  }

  private recalculateScore(): void {
    const criteria = this.state.criteriaStatus || {}
    let passed = 0
    let total = 0
    let autoFailed = false

    for (const [id, status] of Object.entries(criteria)) {
      if (id === '1.3') continue
      total++
      if (status.pass) passed++
      if (status.pass === false && RUBRIC_KEYWORDS[id]?.autoFail) {
        autoFailed = true
      }
    }

    if (Object.keys(criteria).length === 0) {
      const elapsed = Math.round((Date.now() - this.startTime) / 1000)
      if (elapsed < 30) {
        this.state.score = 100
        return
      }
    }

    if (autoFailed) {
      this.state.score = 0
      return
    }

    this.state.score = total > 0 ? Math.round((passed / total) * 100) : 100
  }

  private getCriterionName(id: string): string {
    const names: Record<string, string> = {
      '1.1': 'Approved Greeting',
      '1.2': 'Caller Name Confirmed',
      '1.3': 'Reason for Call Identified',
      '1.4': 'Location Verified',
      '2.1': 'Sobriety Time Asked',
      '2.2': 'Substance Type Asked',
      '2.3': 'Insurance Type Asked',
      '2.4': 'Additional Info Gathered',
      '2.5': 'Phone Number Verified',
      '3.4': 'Qualified Transfer',
      '3.7': 'Empathy Shown',
      '5.1': 'HIPAA Compliance',
      '5.2': 'No Medical Advice',
    }
    return names[id] || id
  }

  private downsample(buffer: Float32Array, from: number, to: number): Float32Array {
    if (from === to) return buffer
    const ratio = from / to
    const newLength = Math.round(buffer.length / ratio)
    const result = new Float32Array(newLength)
    for (let i = 0; i < newLength; i++) {
      result[i] = buffer[Math.round(i * ratio)]
    }
    return result
  }

  private toInt16Array(buffer: Float32Array): Int16Array {
    const result = new Int16Array(buffer.length)
    for (let i = 0; i < buffer.length; i++) {
      result[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7FFF
    }
    return result
  }

  stop(): void {
    this.isManualStop = true

    if (this.ws) {
      try {
        this.ws.send(JSON.stringify({ type: 'Terminate' }))
      } catch {
        // ignore
      }
      setTimeout(() => {
        if (this.ws) {
          try { this.ws.close() } catch { /* ignore */ }
          this.ws = null
        }
      }, 1000)
    }

    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    if (this.microphone) {
      this.microphone.disconnect()
      this.microphone = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    this.onStateChange({ isConnected: false, isRecording: false })
  }

  getState(): Partial<LiveCallState> {
    return this.state
  }
}
