import { useState, useEffect, useCallback } from 'react'
import { Call } from '@/lib/ctm'

export interface RubricResult {
  id: string
  criterion: string
  pass: boolean
  ztp: boolean
  autoFail: boolean
  details: string
  deduction: number
  severity: string
  category: string
}

export interface RubricBreakdown {
  opening_score: number
  opening_max: number
  probing_score: number
  probing_max: number
  qualification_score_detail: number
  qualification_max: number
  closing_score: number
  closing_max: number
  compliance_score: number
  compliance_max: number
}

export interface AnalysisResult {
  score: number
  sentiment: string
  summary: string
  tags: string[]
  disposition: string
  rubric_results?: RubricResult[]
  rubric_breakdown?: RubricBreakdown
}

interface UseCallDetailReturn {
  call: Call | null
  transcript: string
  transcriptError: string | null
  isTranscribing: boolean
  analysis: AnalysisResult | null
  isAnalyzing: boolean
  isLoading: boolean
  isSyncing: boolean
  error: string | null
  handleTranscribe: () => Promise<string | null>
  handleAnalyze: () => Promise<boolean>
  setAnalysis: React.Dispatch<React.SetStateAction<AnalysisResult | null>>
  updateCallNotes: (notes: string) => void
}

export function useCallDetail(callId: string): UseCallDetailReturn {
  const [call, setCall] = useState<Call | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const [transcriptError, setTranscriptError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const storeAnalysisToSupabase = useCallback(async (analysisData: AnalysisResult) => {
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calls: [{
            id: callId,
            score: analysisData.score,
            sentiment: analysisData.sentiment,
            summary: analysisData.summary,
            tags: analysisData.tags,
            disposition: analysisData.disposition,
            rubricResults: analysisData.rubric_results,
            rubricBreakdown: analysisData.rubric_breakdown,
          }],
        }),
      })
      if (!res.ok) console.warn('Failed to store analysis to Supabase')
    } catch (err) {
      console.warn('Failed to store analysis to Supabase:', err)
    }
  }, [callId])

  const updateCallNotes = useCallback((notes: string) => {
    setCall(prev => prev ? { ...prev, notes } : null)
  }, [])

  const fetchCallDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/calls?ctmCallId=${callId}&cacheOnly=true`)
      const data = await res.json()

      if (data.calls && data.calls.length > 0) {
        const c = data.calls[0]
        if (c.analysis) {
          c.score = c.analysis.score
          c.sentiment = c.analysis.sentiment
          c.summary = c.analysis.summary
          c.tags = c.analysis.tags
          c.disposition = c.analysis.disposition
        }
        return c
      }
      return null
    } catch {
      return null
    }
  }, [callId])

  const fetchCallFromCTM = useCallback(async () => {
    try {
      const ctmRes = await fetch(`/api/ctm/calls/${callId}`)
      if (!ctmRes.ok) throw new Error('Call not found')
      const ctmData = await ctmRes.json()
      if (!ctmData.call) throw new Error('Call not found')
      return ctmData.call
    } catch (err) {
      throw err
    }
  }, [callId])

  const handleTranscribe = useCallback(async (): Promise<string | null> => {
    setTranscriptError(null)
    setIsTranscribing(true)
    try {
      const res = await fetch(`/api/ctm/calls/${callId}/transcript`)
      const data = await res.json()

      if (data.transcript) {
        setTranscript(data.transcript)
        return data.transcript as string
      } else if (data.error) {
        setTranscriptError(data.error + (data.details ? `: ${data.details}` : ''))
        return null
      }
      return null
    } catch {
      setTranscriptError('Failed to transcribe audio')
      return null
    } finally {
      setIsTranscribing(false)
    }
  }, [callId])

  const handleAnalyze = useCallback(async (): Promise<boolean> => {
    setIsAnalyzing(true)
    try {
      const res = await fetch('/api/ctm/calls/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callIds: [callId] }),
      })

      if (res.ok) {
        const data = await res.json()
        const result = data.results?.[0]
        if (result?.success && result.analysis) {
          const newAnalysis: AnalysisResult = {
            score: result.analysis.score ?? 0,
            sentiment: result.analysis.sentiment ?? 'neutral',
            summary: result.analysis.summary ?? '',
            tags: result.analysis.tags ?? [],
            disposition: result.analysis.disposition ?? '',
            rubric_results: result.analysis.rubric_results,
            rubric_breakdown: result.analysis.rubric_breakdown,
          }
          setAnalysis((prev) => ({ ...prev, ...newAnalysis }))
          await storeAnalysisToSupabase(newAnalysis)
          return true
        } else if (result?.error) {
          setError(`Analysis error: ${result.error}`)
        }
      }
      return false
    } catch (err) {
      console.error('Analysis failed:', err)
      return false
    } finally {
      setIsAnalyzing(false)
    }
  }, [callId, storeAnalysisToSupabase])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      setIsLoading(true)
      setIsSyncing(true)
      setError(null)

      const cachedCall = await fetchCallDetails()

      if (cancelled) return

      const hasCachedAnalysis = cachedCall && cachedCall.analysis && cachedCall.analysis.rubric_results

      if (cachedCall) {
        setCall(cachedCall)
        if (cachedCall.analysis) {
          setAnalysis({
            score: cachedCall.score || 0,
            sentiment: cachedCall.sentiment || 'neutral',
            summary: cachedCall.summary || '',
            tags: cachedCall.tags || [],
            disposition: cachedCall.disposition || '',
            rubric_results: (cachedCall.analysis as AnalysisResult).rubric_results,
            rubric_breakdown: (cachedCall.analysis as AnalysisResult).rubric_breakdown,
          })
        }
        if (cachedCall.transcript) {
          setTranscript(cachedCall.transcript)
        }
      }

      const ctmCall = await fetchCallFromCTM()
      if (cancelled) return

      if (ctmCall) {
        if (ctmCall.analysis) {
          ctmCall.score = ctmCall.analysis.score
          ctmCall.sentiment = ctmCall.analysis.sentiment
          ctmCall.summary = ctmCall.analysis.summary
          ctmCall.tags = ctmCall.analysis.tags
          ctmCall.disposition = ctmCall.analysis.disposition
        }
        if (ctmCall.transcript) {
          setTranscript(ctmCall.transcript)
        }
        
        if (!hasCachedAnalysis) {
          setCall(ctmCall)
        }

        if (!hasCachedAnalysis && ctmCall.analysis) {
          setAnalysis({
            score: ctmCall.score || 0,
            sentiment: ctmCall.sentiment || 'neutral',
            summary: ctmCall.summary || '',
            tags: ctmCall.tags || [],
            disposition: ctmCall.disposition || '',
            rubric_results: (ctmCall.analysis as AnalysisResult).rubric_results,
            rubric_breakdown: (ctmCall.analysis as AnalysisResult).rubric_breakdown,
          })
        }

        if (!hasCachedAnalysis) {
          await fetch('/api/calls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calls: [ctmCall] }),
          })
        }
      }

      if (cancelled) return

      const fetchedCall = ctmCall || cachedCall
      if (!fetchedCall) {
        setError('Call not found')
        return
      }

      if (fetchedCall.transcript) {
        if (!fetchedCall.analysis?.score && !fetchedCall.analysis?.sentiment) {
          await handleAnalyze()
        }
      } else if (fetchedCall.recordingUrl) {
        setIsTranscribing(true)
        const transcriptText = await handleTranscribe()
        if (transcriptText) {
          await handleAnalyze()
        }
      }
    }

    init()
      .catch((err) => setError(err instanceof Error ? err.message : 'An error occurred'))
      .finally(() => {
        setIsLoading(false)
        setIsSyncing(false)
      })

    return () => {
      cancelled = true
    }
  }, [callId, fetchCallDetails, fetchCallFromCTM, handleTranscribe, handleAnalyze])

  return {
    call,
    transcript,
    transcriptError,
    isTranscribing,
    analysis,
    isAnalyzing,
    isLoading,
    isSyncing,
    error,
    handleTranscribe,
    handleAnalyze,
    setAnalysis,
    updateCallNotes,
  }
}
