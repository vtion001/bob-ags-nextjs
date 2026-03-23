import { RealtimeTranscript, RealtimeInsight, LiveCallState } from './types'
import {
  RUBRIC_KEYWORDS,
  INSURANCE_PATTERNS,
  STATE_PATTERNS,
  NAME_PATTERNS,
} from './constants'
import { detectSentiment, recalculateScore, getCriterionName, analyzeTextForInsights } from './analyzer'

interface AAIRealtimeMessage {
  type: string;
  [key: string]: unknown;
}

export class AssemblyAIRealtime {
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private processor: AudioWorkletNode | ScriptProcessorNode | null = null;
  private sampleRate = 16000;
  private onTranscript: (t: RealtimeTranscript) => void;
  private onInsight: (i: RealtimeInsight) => void;
  private onStateChange: (s: Partial<LiveCallState>) => void;
  private onError: (e: Error) => void;
  private onClose: () => void;
  private state: Partial<LiveCallState> = {};
  private startTime = 0;
  private turnCount = 0;
  private lastSpeaker = "";
  private apiKey: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private isManualStop = false;
  private isReconnecting = false;
  private bufferQueue: Int16Array[] = [];
  private sessionBegun = false;

  constructor(opts: {
    apiKey: string;
    onTranscript: (t: RealtimeTranscript) => void;
    onInsight: (i: RealtimeInsight) => void;
    onStateChange: (s: Partial<LiveCallState>) => void;
    onError: (e: Error) => void;
    onClose: () => void;
  }) {
    this.apiKey = opts.apiKey;
    this.onTranscript = opts.onTranscript;
    this.onInsight = opts.onInsight;
    this.onStateChange = opts.onStateChange;
    this.onError = opts.onError;
    this.onClose = opts.onClose;
  }

  async connect(callId?: string): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
      });
    } catch (err) {
      const domErr = err as DOMException;
      if (domErr.name === "NotAllowedError" || domErr.name === "PermissionDeniedError") {
        this.onError(new Error("Microphone access denied. Please allow microphone access in your browser settings and try again."));
        return;
      }
      if (domErr.name === "NotFoundError") {
        this.onError(new Error("No microphone found. Please connect a microphone and try again."));
        return;
      }
      this.onError(new Error(`Microphone error: ${domErr.message || "Unknown error"}`));
      return;
    }

    try {
      this.audioContext = new AudioContext({ sampleRate: 48000 });
      await this.audioContext.resume();
      this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream);

      let useWorklet = true;
      try {
        await this.audioContext.audioWorklet.addModule('/audio-worklet-processor.js');
        this.processor = new AudioWorkletNode(this.audioContext, 'audio-processing-worklet', {
          numberOfInputs: 1,
          numberOfOutputs: 0,
        });
      this.processor.port.onmessage = (event) => {
        if (event.data.type === 'audio' && this.ws?.readyState === WebSocket.OPEN) {
          const int16Array = new Int16Array(event.data.buffer);
          console.log('[AAI] Sending audio chunk, bytes:', int16Array.length);
          this.ws.send(int16Array);
        } else if (event.data.type === 'audio') {
          console.log('[AAI] Audio ready but WebSocket not open, queuing. State:', this.ws?.readyState);
          this.bufferQueue.push(new Int16Array(event.data.buffer));
        }
      };
        console.log('[AAI] Using AudioWorkletNode');
      } catch (err) {
        console.warn('[AAI] AudioWorklet not supported, falling back to ScriptProcessorNode:', err);
        useWorklet = false;
        const bufferSize = 4096;
        this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
        (this.processor as ScriptProcessorNode).onaudioprocess = (e: any) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const downsampled = this.downsample(inputData, 48000, this.sampleRate);
          if (this.ws?.readyState === WebSocket.OPEN) {
            const int16Array = this.toInt16Array(downsampled);
            console.log('[AAI] ScriptProcessor sending audio chunk, bytes:', int16Array.length);
            this.ws.send(int16Array);
          }
        };
        console.log('[AAI] Using ScriptProcessorNode');
      }

      this.microphone.connect(this.processor);

      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=${this.sampleRate}&speech_model=universal&token=${this.apiKey}`;
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = () => {
        console.log('[AAI] WebSocket connected');
        this.startTime = Date.now();
        this.reconnectAttempts = 0;
        this.isReconnecting = false;
        this.sessionBegun = false;
        this.onStateChange({ isConnected: true, isRecording: true, duration: 0 });
        if (callId) this.onStateChange({ callerPhone: callId });
        this.flushBufferQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const data: AAIRealtimeMessage =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : JSON.parse(new TextDecoder().decode(event.data as ArrayBuffer));
          this.handleMessage(data);
        } catch { /* ignore parse errors */ }
      };

      this.ws.onerror = () => {
        if (!this.isManualStop && !this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.isReconnecting = true;
          setTimeout(() => {
            this.isReconnecting = false;
            if (!this.isManualStop) this.attemptReconnect(callId);
          }, 2000 * this.reconnectAttempts);
        } else if (!this.isManualStop) {
          this.onError(new Error("AssemblyAI WebSocket connection failed. Check your API key and internet connection."));
        }
      };

      this.ws.onclose = (event) => {
        if (!this.isManualStop && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.isReconnecting = true;
          console.log(`[AAI] WebSocket closed, attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          setTimeout(() => {
            this.isReconnecting = false;
            if (!this.isManualStop) this.attemptReconnect(callId);
          }, 2000 * this.reconnectAttempts);
        } else if (!this.isManualStop) {
          console.log('[AAI] WebSocket closed, max reconnects reached');
          this.onClose();
        }
      };
    } catch (err) {
      this.onError(new Error(`Failed to start live analysis: ${err instanceof Error ? err.message : "Unknown error"}`));
    }
  }

  private attemptReconnect(callId?: string): void {
    if (this.isManualStop || this.ws) return;
    try {
      const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=${this.sampleRate}&speech_model=universal&token=${this.apiKey}`;
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = "arraybuffer";

      this.ws.onopen = () => {
        this.startTime = Date.now();
        this.sessionBegun = false;
        this.isReconnecting = false;
        this.onStateChange({ isConnected: true, isRecording: true });
        this.flushBufferQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          let data: AAIRealtimeMessage;
          if (typeof event.data === "string") {
            data = JSON.parse(event.data);
          } else {
            const text = new TextDecoder().decode(event.data as ArrayBuffer);
            data = JSON.parse(text);
          }
          this.handleMessage(data);
        } catch (err) {
          console.warn("[AAI] Reconnect parse error:", err);
        }
      };

      this.ws.onerror = () => {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.onError(new Error("AssemblyAI WebSocket reconnect failed"));
        }
      };

      this.ws.onclose = () => {
        if (!this.isManualStop && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`[AAI] Reconnect closed, attempting ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          setTimeout(() => {
            if (!this.isManualStop) this.attemptReconnect(callId);
          }, 2000 * this.reconnectAttempts);
        } else if (!this.isManualStop) {
          this.onClose();
        }
      };
    } catch {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.onError(new Error("AssemblyAI WebSocket reconnect failed"));
      }
    }
  }

  private flushBufferQueue(): void {
    for (const buffer of this.bufferQueue) {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(buffer);
      }
    }
    this.bufferQueue = [];
  }

  private handleMessage(data: AAIRealtimeMessage): void {
    const msgType = data.type;
    console.log('[AAI] Message received:', msgType);

    if (msgType === "Begin") {
      this.sessionBegun = true;
      const sessionId = data.id as string | undefined;
      this.onStateChange({ sessionId });
      return;
    }

    if (msgType === "Turn") {
      const transcriptText = (data.transcript as string | undefined)?.trim();
      const isFormatted =
        (data.turn_is_formatted as boolean | undefined) ?? false;

      if (!transcriptText) return;

      this.turnCount++;
      const speakerLabel = data.speaker_label as string | undefined;
      const speaker = this.resolveSpeaker(speakerLabel, transcriptText);
      const now = Date.now();
      const elapsed = Math.round((now - this.startTime) / 1000);

      const transcript: RealtimeTranscript = {
        text: transcriptText,
        speaker,
        timestamp: now,
        confidence: 1,
        startTime: elapsed - Math.round(transcriptText.split(" ").length * 0.4),
        endTime: elapsed,
      };

      this.onTranscript(transcript);
      this.analyzeText(transcriptText, speaker, elapsed);
      return;
    }

    if (msgType === "PartialTurn") {
      const partialText = (data.transcript as string | undefined)?.trim();
      if (!partialText) return;
      return;
    }

    if (msgType === "Termination") {
      const audioDuration =
        (data.audio_duration_seconds as number | undefined) ?? 0;
      const sessionDuration =
        (data.session_duration_seconds as number | undefined) ?? 0;
      this.onStateChange({
        audioDuration,
        isConnected: false,
        isRecording: false,
      });
      return;
    }

    if (msgType === "SessionBegins") {
      return;
    }
  }

  private resolveSpeaker(speakerLabel: string | undefined, text: string): string {
    if (speakerLabel) {
      const label = speakerLabel.toUpperCase();
      if (label === "A" || label === "AGENT" || label === "SPK_00") {
        return "Agent";
      }
      if (label === "B" || label === "CALLER" || label === "SPK_01") {
        return "Caller";
      }
      return label;
    }
    return this.detectSpeakerFallback(text);
  }

  private detectSpeakerFallback(text: string): string {
    const lower = text.toLowerCase();

    if (
      lower.includes("flyland") ||
      lower.includes("thank you for calling") ||
      lower.includes("my name is") ||
      lower.includes("this is ") ||
      lower.includes("how can i help") ||
      lower.includes("what can i do for you") ||
      lower.includes("hi ") ||
      lower.includes("hello ")
    ) {
      return "Agent";
    }

    if (
      lower.includes("i need") ||
      lower.includes("i am") ||
      lower.includes("i'm") ||
      lower.includes("i was") ||
      lower.includes("my husband") ||
      lower.includes("my son") ||
      lower.includes("my daughter") ||
      lower.includes("my mom") ||
      lower.includes("my dad")
    ) {
      return "Caller";
    }

    this.turnCount++;
    const speaker = this.turnCount % 2 === 1 ? "Agent" : "Caller";
    return speaker;
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

  private downsample(
    buffer: Float32Array,
    from: number,
    to: number,
  ): Float32Array {
    if (from === to) return buffer;
    const ratio = from / to;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      result[i] = buffer[Math.round(i * ratio)];
    }
    return result;
  }

  private toInt16Array(buffer: Float32Array): Int16Array {
    const result = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      result[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7fff;
    }
    return result;
  }

  stop(): void {
    this.isManualStop = true;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify({ type: "Terminate" }));
      } catch {
        // ignore
      }
      setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          try {
            this.ws.close();
          } catch {
            /* ignore */
          }
        }
        this.ws = null;
      }, 1000);
    } else {
      this.ws = null;
    }

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    this.onStateChange({ isConnected: false, isRecording: false });
  }

  getState(): Partial<LiveCallState> {
    return this.state;
  }
}