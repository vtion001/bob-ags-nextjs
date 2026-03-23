class AudioProcessingWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sampleRate = 16000;
    this.bufferSize = 4096;
    this.inputSampleRate = 48000;
    this.downsampleRatio = this.inputSampleRate / this.sampleRate;
    this.buffer = [];
  }

  downsample(buffer, from, to) {
    if (from === to) return buffer;
    const ratio = from / to;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      result[i] = buffer[Math.round(i * ratio)];
    }
    return result;
  }

  toInt16Array(buffer) {
    const result = new Int16Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      result[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7fff;
    }
    return result;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) {
      return true;
    }

    const inputData = input[0];
    const downsampled = this.downsample(inputData, this.inputSampleRate, this.sampleRate);
    const int16Array = this.toInt16Array(downsampled);

    this.port.postMessage({
      type: 'audio',
      buffer: int16Array.buffer,
    });

    return true;
  }
}

registerProcessor('audio-processing-worklet', AudioProcessingWorklet);