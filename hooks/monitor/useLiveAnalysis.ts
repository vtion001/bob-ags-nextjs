import { useState, useCallback, useRef, useEffect } from "react"
import {
  AssemblyAIRealtime,
  type RealtimeTranscript,
  type RealtimeInsight,
  type LiveCallState,
} from "@/lib/realtime"
import { useLiveMonitoringStore } from "@/lib/stores/liveMonitoringStore"

interface UseLiveAnalysisOptions {
  onError?: (error: string) => void
  onClose?: () => void
}

interface UseLiveAnalysisReturn {
  isMonitoring: boolean
  isRecording: boolean
  liveState: Partial<LiveCallState>
  recentInsights: RealtimeInsight[]
  error: string | null
  startMonitoring: (callId?: string) => Promise<void>
  stopMonitoring: () => void
}

export function useLiveAnalysis(options: UseLiveAnalysisOptions = {}): UseLiveAnalysisReturn {
  const { onError, onClose } = options

  const onErrorRef = useRef(onError)
  const onCloseRef = useRef(onClose)
  onErrorRef.current = onError
  onCloseRef.current = onClose

  const [error, setError] = useState<string | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)

  const realtimeRef = useRef<AssemblyAIRealtime | null>(null)
  const durationRef = useRef<NodeJS.Timeout | null>(null)
  const startingRef = useRef(false)

  const store = useLiveMonitoringStore()

  const startMonitoring = useCallback(async (_callId?: string) => {
    if (startingRef.current) return
    startingRef.current = true

    try {
      const apiKey = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY

      if (!apiKey) {
        const errMsg = "AssemblyAI API key not configured. Check NEXT_PUBLIC_ASSEMBLYAI_API_KEY in your environment variables."
        setError(errMsg)
        onErrorRef.current?.(errMsg)
        return
      }

      setError(null)
      setIsMonitoring(true)
      store.reset()
      store.setConnected(false)
      store.setRecording(false)

      console.log('[LiveAnalysis] Creating AssemblyAIRealtime instance...')
      const rt = new AssemblyAIRealtime({
        apiKey,
        onTranscript: (t: RealtimeTranscript) => {
          store.addTranscript(t)
        },
        onInsight: (i: RealtimeInsight) => {
          store.addInsight(i)
        },
        onStateChange: (s: Partial<LiveCallState>) => {
          if (s.isConnected !== undefined) {
            store.setConnected(s.isConnected)
          }
          if (s.isRecording !== undefined) {
            store.setRecording(s.isRecording)
          }
          if (s.sessionId) {
            store.setSessionId(s.sessionId)
          }
        },
        onError: (e: Error) => {
          console.error('[LiveAnalysis] onError:', e.message)
          setError(e.message)
          store.setRecording(false)
          setIsMonitoring(false)
          onErrorRef.current?.(e.message)
        },
        onClose: () => {
          console.log('[LiveAnalysis] onClose called')
          store.setRecording(false)
          setIsMonitoring(false)
          store.flushBatches()
          onCloseRef.current?.()
        },
      })

      realtimeRef.current = rt
      console.log('[LiveAnalysis] Calling rt.connect()...')

      try {
        await rt.connect()
        console.log('[LiveAnalysis] rt.connect() completed successfully')
      } catch (err) {
        console.error('[LiveAnalysis] rt.connect() threw error:', err)
        const errMsg = err instanceof Error ? err.message : "Failed to start live analysis. Please check your microphone and API key."
        setError(errMsg)
        setIsMonitoring(false)
        onErrorRef.current?.(errMsg)
      }

      durationRef.current = setInterval(() => {
        store.setDuration((store.duration || 0) + 1)
      }, 1000)
    } finally {
      startingRef.current = false
    }
  }, [])

  const stopMonitoring = useCallback(() => {
    if (realtimeRef.current) {
      realtimeRef.current.stop()
      realtimeRef.current = null
    }
    if (durationRef.current) {
      clearInterval(durationRef.current)
      durationRef.current = null
    }
    store.flushBatches()
    setIsMonitoring(false)
  }, [])

  useEffect(() => {
    return () => {
      if (realtimeRef.current) {
        realtimeRef.current.stop()
      }
      if (durationRef.current) {
        clearInterval(durationRef.current)
      }
    }
  }, [])

  const liveState: Partial<LiveCallState> = {
    isConnected: store.isConnected,
    isRecording: store.isRecording,
    duration: store.duration,
    transcript: store.transcript,
    insights: store.insights,
    sentiment: store.sentiment,
    sentimentScore: store.sentimentScore,
    criteriaStatus: store.criteriaStatus,
    score: store.score,
    sessionId: store.sessionId,
  }

  return {
    isMonitoring,
    isRecording: store.isRecording,
    liveState,
    recentInsights: store.insights.slice(0, 50),
    error,
    startMonitoring,
    stopMonitoring,
  }
}
