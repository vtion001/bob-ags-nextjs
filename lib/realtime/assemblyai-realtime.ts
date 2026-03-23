import { StreamingTranscriber } from 'assemblyai'
import { RealtimeTranscript, RealtimeInsight, LiveCallState } from './types'
import { analyzeTextForInsights } from './analyzer'

export class AssemblyAIRealtime {
  private static instanceCount = 0;
  private instanceId: number;
  private transcriber: StreamingTranscriber | null = null;
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
  private startTime = 0;
  private state: any = {};
  private bufferFlushInterval: ReturnType<typeof setInterval> | null = null;
  private audioBuffer: Int16Array[] = [];
  private flushAudioBuffer: () => void = () => {};

  constructor(opts: {
    apiKey: string;
    onTranscript: (t: RealtimeTranscript) => void;
    onInsight: (i: RealtimeInsight) => void;
    onStateChange: (s: Partial<LiveCallState>) => void;
    onError: (e: Error) => void;
    onClose: () => void;
  }) {
    AssemblyAIRealtime.instanceCount++;
    this.instanceId = AssemblyAIRealtime.instanceCount;
    this.onTranscript = opts.onTranscript;
    this.onInsight = opts.onInsight;
    this.onStateChange = opts.onStateChange;
    this.onError = opts.onError;
    this.onClose = opts.onClose;
    console.log(`[AAI] Instance #${this.instanceId} created`);
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
      console.log('[AAI] Fetching temporary token from server...');
      const tokenResponse = await fetch('/api/assemblyai/token', { method: 'GET' });
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Failed to get AssemblyAI token: ${tokenResponse.status} ${errorText}`);
      }
      const data = await tokenResponse.json();
      
      if (!data.token) {
        throw new Error('No token in response. Response: ' + JSON.stringify(data));
      }
      const token = data.token;
      console.log('[AAI] Got temporary token');

      this.audioContext = new AudioContext({ sampleRate: 48000 });
      await this.audioContext.resume();

      console.log('[AAI] Creating StreamingTranscriber...');
      this.transcriber = new StreamingTranscriber({
        token: token,
        sampleRate: this.sampleRate,
        speechModel: 'u3-rt-pro',
        speakerLabels: true,
      });

      let isReady = false;
      let sessionId: string | null = null;

      this.transcriber.on('open', (event) => {
        console.log('[AAI] StreamingTranscriber OPEN. Session ID:', event.id);
        sessionId = event.id;
        this.startTime = Date.now();
        isReady = true;
        this.onStateChange({ isConnected: true, isRecording: true });
      });

      this.transcriber.on('turn', (event) => {
        console.log('[AAI] Turn received:', event.transcript);
        if (event.transcript) {
          const now = Date.now();
          const elapsed = Math.round((now - this.startTime) / 1000);
          const transcriptText = event.transcript.trim();
          
          const transcript: RealtimeTranscript = {
            text: transcriptText,
            speaker: event.speaker_label || 'Agent',
            timestamp: now,
            confidence: event.end_of_turn_confidence ?? 1,
            startTime: elapsed - Math.round(transcriptText.split(" ").length * 0.4),
            endTime: elapsed,
          };

          this.onTranscript(transcript);
          this.analyzeText(transcriptText, event.speaker_label || 'Agent', elapsed);
        }
      });

      this.transcriber.on('error', (error) => {
        console.error('[AAI] StreamingTranscriber ERROR:', error);
        this.onError(new Error(`AssemblyAI streaming error: ${error.message}`));
      });

      this.transcriber.on('close', (code, reason) => {
        console.log('[AAI] StreamingTranscriber CLOSED. Code:', code, 'Reason:', reason);
        isReady = false;
        this.onStateChange({ isConnected: false, isRecording: false });
        this.onClose();
      });

      console.log('[AAI] Connecting to AssemblyAI...');
      await this.transcriber.connect();
      console.log('[AAI] connect() returned, waiting for open event...');

      // Wait for the 'open' event before starting audio
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (isReady) {
            console.log('[AAI] Session ready, waiting 5 seconds for socket to be fully ready...');
            setTimeout(() => {
              console.log('[AAI] Starting audio processor now');
              resolve();
            }, 5000);
          } else {
            setTimeout(checkReady, 50);
          }
        };
        checkReady();
      });

      this.microphone = this.audioContext.createMediaStreamSource(this.mediaStream);

      const sendAudioSafe = (buffer: ArrayBufferLike) => {
        if (!this.transcriber || !isReady) return;
        try {
          this.transcriber.sendAudio(buffer as ArrayBuffer);
        } catch (err) {
          console.warn('[AAI] sendAudio error (socket may not be ready):', err);
        }
      };

      // Buffer audio to accumulate at least 50ms worth of samples before sending
      // At 16kHz, 50ms = 800 samples
      const minSamplesPerChunk = 800;
      this.audioBuffer = [];
      
      this.flushAudioBuffer = () => {
        if (this.audioBuffer.length === 0) return;
        const totalSamples = this.audioBuffer.reduce((sum, arr) => sum + arr.length, 0);
        if (totalSamples < minSamplesPerChunk) return;
        
        // Combine all buffers into one
        const combined = new Int16Array(totalSamples);
        let offset = 0;
        for (const chunk of this.audioBuffer) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        
        console.log('[AAI] Sending buffered audio:', combined.length, 'samples (~' + (combined.length / 16).toFixed(0) + 'ms)');
        sendAudioSafe(combined.buffer);
        this.audioBuffer.length = 0;
      };

      // Set up interval to flush buffer every 50ms
      this.bufferFlushInterval = setInterval(this.flushAudioBuffer, 50);

      let useWorklet = true;
      try {
        await this.audioContext.audioWorklet.addModule('/audio-worklet-processor.js');
        this.processor = new AudioWorkletNode(this.audioContext, 'audio-processing-worklet', {
          numberOfInputs: 1,
          numberOfOutputs: 0,
        });
        this.processor.port.onmessage = (event) => {
          if (event.data.type === 'audio' && this.transcriber && isReady) {
            const int16Array = new Int16Array(event.data.buffer);
            this.audioBuffer.push(int16Array);
          }
        };
        console.log('[AAI] Using AudioWorkletNode');
      } catch (err) {
        console.warn('[AAI] AudioWorklet not supported, falling back to ScriptProcessorNode:', err);
        useWorklet = false;
        const bufferSize = 4096;
        this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
        (this.processor as ScriptProcessorNode).onaudioprocess = (e: any) => {
          if (!this.transcriber || !isReady) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const downsampled = this.downsample(inputData, 48000, this.sampleRate);
          const int16Array = this.toInt16Array(downsampled);
          this.audioBuffer.push(int16Array);
        };
        console.log('[AAI] Using ScriptProcessorNode');
      }

      this.microphone.connect(this.processor);
      console.log('[AAI] Microphone connected to processor');

    } catch (err) {
      this.onError(new Error(`Failed to start live analysis: ${err instanceof Error ? err.message : "Unknown error"}`));
    }
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
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
      this.bufferFlushInterval = null;
    }
    this.flushAudioBuffer();
    
    if (this.transcriber) {
      this.transcriber.close();
      this.transcriber = null;
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