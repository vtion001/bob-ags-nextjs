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
  error: string | null
  handleTranscribe: () => Promise<string | null>
  handleAnalyze: () => Promise<boolean>
}

export function useCallDetail(callId: string): UseCallDetailReturn {
  const [call, setCall] = useState<Call | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const [transcriptError, setTranscriptError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const storeCallToSupabase = useCallback(async (callData: Record<string, unknown>) => {
    try {
      await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calls: [callData] }),
      })
    } catch (err) {
      console.warn('Failed to store call to Supabase:', err)
    }
  }, [])

  const fetchCallDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/calls?ctmCallId=${callId}&skipSync=true`)
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

      const ctmRes = await fetch(`/api/ctm/calls/${callId}`)
      if (ctmRes.ok) {
        const ctmData = await ctmRes.json()
        if (ctmData.call) {
          const c = ctmData.call
          if (c.analysis) {
            c.score = c.analysis.score
            c.sentiment = c.analysis.sentiment
            c.summary = c.analysis.summary
            c.tags = c.analysis.tags
            c.disposition = c.analysis.disposition
          }
          await storeCallToSupabase(c)
          return c
        }
      }

      throw new Error('Call not found')
    } catch (err) {
      throw err
    }
  }, [callId, storeCallToSupabase])

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
          setAnalysis((prev) => ({
            ...prev,
            ...result.analysis,
          }))
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
  }, [callId])

  useEffect(() => {
    const init = async () => {
      try {
        const fetchedCall = await fetchCallDetails()
        setCall(fetchedCall)

        if (fetchedCall.analysis) {
          setAnalysis({
            score: fetchedCall.score || 0,
            sentiment: fetchedCall.sentiment || 'neutral',
            summary: fetchedCall.summary || '',
            tags: fetchedCall.tags || [],
            disposition: fetchedCall.disposition || '',
            rubric_results: (fetchedCall.analysis as AnalysisResult).rubric_results,
            rubric_breakdown: (fetchedCall.analysis as AnalysisResult).rubric_breakdown,
          })
        }

        if (fetchedCall.transcript) {
          setTranscript(fetchedCall.transcript)
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [callId, fetchCallDetails, handleTranscribe, handleAnalyze])

  return {
    call,
    transcript,
    transcriptError,
    isTranscribing,
    analysis,
    isAnalyzing,
    isLoading,
    error,
    handleTranscribe,
    handleAnalyze,
  }
}
