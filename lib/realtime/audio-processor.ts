export function downsample(
  buffer: Float32Array,
  from: number,
  to: number,
): Float32Array {
  if (from === to) return buffer
  const ratio = from / to
  const newLength = Math.round(buffer.length / ratio)
  const result = new Float32Array(newLength)
  for (let i = 0; i < newLength; i++) {
    result[i] = buffer[Math.round(i * ratio)]
  }
  return result
}

export function toInt16Array(buffer: Float32Array): Int16Array {
  const result = new Int16Array(buffer.length)
  for (let i = 0; i < buffer.length; i++) {
    result[i] = Math.max(-1, Math.min(1, buffer[i])) * 0x7fff
  }
  return result
}

export function flushAudioBuffer(
  audioBuffer: Int16Array[],
  sendAudio: (buffer: ArrayBuffer) => void,
  minSamples = 800,
  maxSamples = 15000,
): boolean {
  if (audioBuffer.length === 0) return false

  const totalSamples = audioBuffer.reduce((sum, arr) => sum + arr.length, 0)
  if (totalSamples < minSamples) return false

  if (totalSamples > maxSamples) {
    let sentSamples = 0
    while (sentSamples < totalSamples) {
      const remainingSamples = totalSamples - sentSamples
      const chunkSize = Math.min(remainingSamples, maxSamples)

      let collectedSamples = 0
      const chunksToSend: Int16Array[] = []
      for (const chunk of audioBuffer) {
        if (collectedSamples >= chunkSize) break
        const samplesFromThisChunk = Math.min(chunk.length, chunkSize - collectedSamples)
        chunksToSend.push(chunk.slice(0, samplesFromThisChunk))
        collectedSamples += samplesFromThisChunk
      }

      const combined = new Int16Array(chunkSize)
      let offset = 0
      for (const chunk of chunksToSend) {
        combined.set(chunk, offset)
        offset += chunk.length
      }

      sendAudio(combined.buffer)
      sentSamples += chunkSize

      // Remove sent chunks from buffer
      let removeCount = 0
      let removedSamples = 0
      for (const chunk of audioBuffer) {
        if (removedSamples >= chunkSize) break
        const toRemove = Math.min(chunk.length, chunkSize - removedSamples)
        removeCount++
        removedSamples += toRemove
      }
      audioBuffer.splice(0, removeCount)
    }
    return true
  }

  const combined = new Int16Array(totalSamples)
  let offset = 0
  for (const chunk of audioBuffer) {
    combined.set(chunk, offset)
    offset += chunk.length
  }

  sendAudio(combined.buffer)
  audioBuffer.length = 0
  return true
}
