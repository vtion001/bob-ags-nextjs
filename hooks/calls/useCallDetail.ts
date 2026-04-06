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
      // First, check Supabase for cached analysis data
      const cachedRes = await fetch(`/api/calls?ctm_call_id=${callId}`)
      if (cachedRes.ok) {
        const cachedData = await cachedRes.json()
        if (cachedData.calls && cachedData.calls.length > 0) {
          const cachedCall = cachedData.calls[0]
          // If we have analysis data from Supabase, return it
          if (cachedCall.rubric_results || cachedCall.score) {
            console.log('[useCallDetail] Found cached analysis in Supabase for call:', callId)
            return cachedCall
          }
        }
      }

      // Fall back to CTM API if not in Supabase or no analysis
      const res = await fetch(`/api/ctm/calls/${callId}`)
      if (!res.ok) return null
      const data = await res.json()
      if (!data.call) return null
      return data.call
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
      // First, try to get transcript from CTM (pre-transcribed calls)
      const res = await fetch(`/api/ctm/calls/${callId}/transcript`)
      const data = await res.json()

      if (data.transcript && data.transcript.trim()) {
        setTranscript(data.transcript)
        return data.transcript as string
      }

      // If CTM has no transcript, use AssemblyAI to transcribe the recording
      const callRes = await fetch(`/api/ctm/calls/${callId}`)
      if (!callRes.ok) {
        setTranscriptError('Failed to get call details')
        return null
      }
      const callData = await callRes.json()
      const recordingUrl = callData.call?.recordingUrl || callData.call?.audio

      if (!recordingUrl) {
        setTranscriptError('No recording available for this call')
        return null
      }

      // Call AssemblyAI transcription service - it will fetch audio via CTM proxy
      const assemblyRes = await fetch('/api/assemblyai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId }),
      })

      if (!assemblyRes.ok) {
        const errorData = await assemblyRes.json()
        setTranscriptError(errorData.error || 'Transcription failed')
        return null
      }

      const assemblyData = await assemblyRes.json()
      if (assemblyData.transcript) {
        setTranscript(assemblyData.transcript)
        return assemblyData.transcript as string
      }

      setTranscriptError('No transcript generated')
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

      // Check for cached analysis - rubric_results can be on either analysis object (CTM) or directly on call (Supabase)
      const hasCachedAnalysis = cachedCall && (
        (cachedCall.analysis && cachedCall.analysis.rubric_results) ||
        cachedCall.rubric_results
      )

      if (cachedCall) {
        setCall(cachedCall)
        // Check both nested analysis object (CTM) and direct fields (Supabase)
        if (cachedCall.analysis?.rubric_results || cachedCall.rubric_results) {
          setAnalysis({
            score: cachedCall.score || 0,
            sentiment: cachedCall.sentiment || cachedCall.analysis?.sentiment || 'neutral',
            summary: cachedCall.summary || cachedCall.analysis?.summary || '',
            tags: cachedCall.tags || cachedCall.analysis?.tags || [],
            disposition: cachedCall.disposition || cachedCall.analysis?.disposition || '',
            rubric_results: (cachedCall.analysis as AnalysisResult)?.rubric_results || cachedCall.rubric_results,
            rubric_breakdown: (cachedCall.analysis as AnalysisResult)?.rubric_breakdown || cachedCall.rubric_breakdown,
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

      // Use cachedCall if it has analysis, otherwise use ctmCall
      const fetchedCall = hasCachedAnalysis ? cachedCall : (ctmCall || cachedCall)
      if (!fetchedCall) {
        setError('Call not found')
        return
      }

      if (fetchedCall.transcript) {
        // Check both nested analysis (CTM) and direct fields (Supabase)
        const hasScore = fetchedCall.score || fetchedCall.analysis?.score
        const hasSentiment = fetchedCall.sentiment || fetchedCall.analysis?.sentiment
        if (!hasScore && !hasSentiment) {
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
