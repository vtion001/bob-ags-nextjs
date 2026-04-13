import { create } from 'zustand'
import type { RealtimeTranscript, RealtimeInsight } from '@/lib/realtime'

const BATCH_INTERVAL_MS = 100

interface LiveMonitoringState {
  isConnected: boolean
  isRecording: boolean
  duration: number
  transcript: RealtimeTranscript[]
  insights: RealtimeInsight[]
  sentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  criteriaStatus: Record<string, { pass: boolean; triggered: boolean }>
  score: number
  sessionId?: string

  pendingTranscriptBatch: RealtimeTranscript[]
  pendingInsightsBatch: RealtimeInsight[]
  batchTimeout: ReturnType<typeof setTimeout> | null

  setConnected: (connected: boolean) => void
  setRecording: (recording: boolean) => void
  setDuration: (duration: number) => void
  addTranscript: (transcript: RealtimeTranscript) => void
  addInsight: (insight: RealtimeInsight) => void
  updateSentiment: (sentiment: 'positive' | 'neutral' | 'negative', score: number) => void
  updateCriteriaStatus: (criteriaId: string, status: { pass: boolean; triggered: boolean }) => void
  updateScore: (score: number) => void
  setSessionId: (sessionId: string) => void
  flushBatches: () => void
  reset: () => void
}

export const useLiveMonitoringStore = create<LiveMonitoringState>((set, get) => ({
  isConnected: false,
  isRecording: false,
  duration: 0,
  transcript: [],
  insights: [],
  sentiment: 'neutral',
  sentimentScore: 50,
  criteriaStatus: {},
  score: 100,
  sessionId: undefined,

  pendingTranscriptBatch: [],
  pendingInsightsBatch: [],
  batchTimeout: null,

  setConnected: (connected) => set({ isConnected: connected }),

  setRecording: (recording) => set({ isRecording: recording }),

  setDuration: (duration) => set({ duration }),

  addTranscript: (transcript) => {
    const state = get()
    const newBatch = [...state.pendingTranscriptBatch, transcript]

    if (state.batchTimeout) {
      clearTimeout(state.batchTimeout)
    }

    const timeout = setTimeout(() => {
      get().flushBatches()
    }, BATCH_INTERVAL_MS)

    set({ pendingTranscriptBatch: newBatch, batchTimeout: timeout })
  },

  addInsight: (insight) => {
    const state = get()
    const newBatch = [...state.pendingInsightsBatch, insight]

    if (state.batchTimeout) {
      clearTimeout(state.batchTimeout)
    }

    const timeout = setTimeout(() => {
      get().flushBatches()
    }, BATCH_INTERVAL_MS)

    set({ pendingInsightsBatch: newBatch, batchTimeout: timeout })
  },

  updateSentiment: (sentiment, score) => set({ sentiment, sentimentScore: score }),

  updateCriteriaStatus: (criteriaId, status) =>
    set((state) => ({
      criteriaStatus: { ...state.criteriaStatus, [criteriaId]: status },
    })),

  updateScore: (score) => set({ score }),

  setSessionId: (sessionId) => set({ sessionId }),

  flushBatches: () => {
    const state = get()

    if (state.batchTimeout) {
      clearTimeout(state.batchTimeout)
    }

    const transcriptUpdates =
      state.pendingTranscriptBatch.length > 0
        ? {
            transcript: [...state.transcript, ...state.pendingTranscriptBatch].slice(-500),
            pendingTranscriptBatch: [],
          }
        : {}

    const insightUpdates =
      state.pendingInsightsBatch.length > 0
        ? {
            insights: [...state.insights, ...state.pendingInsightsBatch].slice(-100),
            pendingInsightsBatch: [],
          }
        : {}

    set({ ...transcriptUpdates, ...insightUpdates, batchTimeout: null })
  },

  reset: () => {
    const state = get()
    if (state.batchTimeout) {
      clearTimeout(state.batchTimeout)
    }
    set({
      isConnected: false,
      isRecording: false,
      duration: 0,
      transcript: [],
      insights: [],
      sentiment: 'neutral',
      sentimentScore: 50,
      criteriaStatus: {},
      score: 100,
      sessionId: undefined,
      pendingTranscriptBatch: [],
      pendingInsightsBatch: [],
      batchTimeout: null,
    })
  },
}))

export const selectTranscript = (state: LiveMonitoringState) => state.transcript
export const selectInsights = (state: LiveMonitoringState) => state.insights
export const selectIsConnected = (state: LiveMonitoringState) => state.isConnected
export const selectIsRecording = (state: LiveMonitoringState) => state.isRecording
export const selectDuration = (state: LiveMonitoringState) => state.duration
export const selectSentiment = (state: LiveMonitoringState) => ({
  sentiment: state.sentiment,
  score: state.sentimentScore,
})
export const selectScore = (state: LiveMonitoringState) => state.score
export const selectCriteriaStatus = (state: LiveMonitoringState) => state.criteriaStatus
