import { StreamingTranscriber } from 'assemblyai'
import { RealtimeTranscript, RealtimeInsight, LiveCallState } from './types'
import { analyzeTextForInsights } from './analyzer'
import { downsample, toInt16Array, flushAudioBuffer } from './audio-processor'

export class AssemblyAIRealtime {
  private static instanceCount = 0
  private instanceId: number
  private transcriber: StreamingTranscriber | null = null
  private mediaStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private microphone: MediaStreamAudioSourceNode | null = null
  private processor: AudioWorkletNode | ScriptProcessorNode | null = null
  private sampleRate = 16000
  private onTranscript: (t: RealtimeTranscript) => void
  private onInsight: (i: RealtimeInsight) => void
  private onStateChange: (s: Partial<LiveCallState>) => void
  private onError: (e: Error) => void
  private onClose: () => void
  private startTime = 0
  private state: Record<string, unknown> = {}
  private bufferFlushInterval: ReturnType<typeof setInterval> | null = null
  private audioBuffer: Int16Array[] = []
  private flushAudioBufferFn: () => void = () => {}

  constructor(opts: {
    apiKey: string
    onTranscript: (t: RealtimeTranscript) => void
    onInsight: (i: RealtimeInsight) => void
    onStateChange: (s: Partial<LiveCallState>) => void
    onError: (e: Error) => void
    onClose: () => void
  }) {
    AssemblyAIRealtime.instanceCount++
    this.instanceId = AssemblyAIRealtime.instanceCount
    this.onTranscript = opts.onTranscript
    this.onInsight = opts.onInsight
    this.onStateChange = opts.onStateChange
    this.onError = opts.onError
    this.onClose = opts.onClose
    console.log(`[AAI] Instance #${this.instanceId} created`)
  }

  async connect(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      })
    } catch (err) {
      const domErr = err as DOMException
      if (domErr.name === 'NotAllowedError' || domErr.name === 'PermissionDeniedError') {
        this.onError(new Error('Microphone access denied. Please allow microphone access in your browser settings and try again.'))
        return
      }
      if (domErr.name === 'NotFoundError') {
        this.onError(new Error('No microphone found. Please connect a microphone and try again.'))
        return
      }
      this.onError(new Error(`Microphone error: ${domErr.message || 'Unknown error'}`))
      return
    }

    try {
      const tokenResponse = await fetch('/api/assemblyai/token', { method: 'GET' })
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        throw new Error(`Failed to get AssemblyAI token: ${tokenResponse.status} ${errorText}`)
      }
      const data = await tokenResponse.json()

      if (!data.token) {
        throw new Error('No token in response. Response: ' + JSON.stringify(data))
      }

      this.audioContext = new AudioContext({ sampleRate: 48000 })
      await this.audioContext.resume()

      this.transcriber = new StreamingTranscriber({
        token: data.token,
        sampleRate: this.sampleRate,
        speechModel: 'u3-rt-pro',
        speakerLabels: true,
        maxSpeakers: 2,
        prompt: 'This is a phone call. There are two speakers: the insurance agent and the caller.',
      })

      await this.setupTranscriber()
      await this.startAudioPipeline()

    } catch (err) {
      this.onError(new Error(`Failed to start live analysis: ${err instanceof Error ? err.message : 'Unknown error'}`))
    }
  }

  private async setupTranscriber(): Promise<void> {
    if (!this.transcriber) return

    let isReady = false

    this.transcriber.on('open', (event) => {
      console.log('[AAI] StreamingTranscriber OPEN. Session ID:', event.id)
      this.startTime = Date.now()
      isReady = true
      this.onStateChange({ isConnected: true, isRecording: true })
    })

    this.transcriber.on('turn', (event) => {
      if (event.transcript) {
        const now = Date.now()
        const elapsed = Math.round((now - this.startTime) / 1000)
        const transcriptText = event.transcript.trim()

        const transcript: RealtimeTranscript = {
          text: transcriptText,
          speaker: event.speaker_label || 'Agent',
          timestamp: now,
          confidence: event.end_of_turn_confidence ?? 1,
          startTime: elapsed - Math.round(transcriptText.split(' ').length * 0.4),
          endTime: elapsed,
        }

        this.onTranscript(transcript)
        this.analyzeText(transcriptText, event.speaker_label || 'Agent', elapsed)
      }
    })

    this.transcriber.on('error', (error) => {
      console.error('[AAI] StreamingTranscriber ERROR:', error)
      this.onError(new Error(`AssemblyAI streaming error: ${error.message}`))
    })

    this.transcriber.on('close', (code, reason) => {
      console.log('[AAI] StreamingTranscriber CLOSED. Code:', code, 'Reason:', reason)
      this.onStateChange({ isConnected: false, isRecording: false })
      this.onClose()
    })

    await this.transcriber.connect()

    // Wait for ready with 30s timeout
    await Promise.race([
      new Promise<void>((resolve) => {
        const checkReady = () => {
          if ((this.transcriber as any)?._ready) {
            console.log('[AAI] Session ready, waiting 1 second for socket to stabilize...')
            setTimeout(resolve, 1000)
          } else {
            setTimeout(checkReady, 50)
          }
        }
        checkReady()
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AssemblyAI connection timeout after 30s')), 30000)),
    ])
  }

  private async startAudioPipeline(): Promise<void> {
    if (!this.audioContext || !this.transcriber) return

    this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream)

    const sendAudioSafe = (buffer: ArrayBuffer) => {
      if (!this.transcriber) return
      try {
        this.transcriber.sendAudio(buffer as ArrayBuffer)
      } catch (err) {
        console.warn('[AAI] sendAudio error:', err)
      }
    }

    this.flushAudioBufferFn = () => {
      flushAudioBuffer(this.audioBuffer, sendAudioSafe)
    }

    this.bufferFlushInterval = setInterval(this.flushAudioBufferFn, 20)

    try {
      await this.audioContext.audioWorklet.addModule('/audio-worklet-processor.js')
      this.processor = new AudioWorkletNode(this.audioContext, 'audio-processing-worklet', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
      })
      this.processor.port.onmessage = (event) => {
        if (event.data.type === 'audio') {
          const int16Array = new Int16Array(event.data.buffer)
          this.audioBuffer.push(int16Array)
        }
      }
      console.log('[AAI] Using AudioWorkletNode')
    } catch (err) {
      console.warn('[AAI] AudioWorklet not supported, falling back to ScriptProcessorNode:', err)
      const bufferSize = 4096
      this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1)
      ;(this.processor as ScriptProcessorNode).onaudioprocess = (e: any) => {
        const inputData = e.inputBuffer.getChannelData(0)
        const downsampled = downsample(inputData, 48000, this.sampleRate)
        const int16Array = toInt16Array(downsampled)
        this.audioBuffer.push(int16Array)
      }
      console.log('[AAI] Using ScriptProcessorNode')
    }

    this.microphone.connect(this.processor)
    console.log('[AAI] Microphone connected to processor')
  }

  private analyzeText(text: string, speaker: string, elapsed: number): void {
    analyzeTextForInsights(
      text,
      speaker,
      elapsed,
      this.state,
      this.onInsight,
      (update) => {
        this.state = { ...this.state, ...update }
      },
      this.startTime
    )
  }

  stop(): void {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval)
      this.bufferFlushInterval = null
    }
    this.flushAudioBufferFn()

    if (this.transcriber) {
      this.transcriber.close()
      this.transcriber = null
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
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    }

    this.onStateChange({ isConnected: false, isRecording: false })
  }

  getState(): Partial<LiveCallState> {
    return this.state
  }
}
