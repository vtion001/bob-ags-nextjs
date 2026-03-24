import { useState, useCallback, useRef, useEffect } from 'react'
import { type RealtimeTranscript } from '@/lib/realtime'

export interface LiveAIInsight {
  id: string
  type: 'insight' | 'suggestion' | 'warning' | 'disposition'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  timestamp: number
}

export interface LiveAnalysisLogEntry {
  id: string
  callId?: string
  callPhone?: string
  callDirection?: string
  callTimestamp?: string
  suggestedDisposition?: string
  insights: LiveAIInsight[]
  transcriptPreview?: string
  createdAt: string
}

interface UseLiveAIInsightsOptions {
  onError?: (error: string) => void
  callId?: string
  callPhone?: string
  callDirection?: string
  callTimestamp?: string
}

interface UseLiveAIInsightsReturn {
  aiInsights: LiveAIInsight[]
  suggestedDisposition: string | null
  isAnalyzing: boolean
  lastAnalyzedAt: number | null
  resetInsights: () => void
  analyzeNow: (transcript: string, context?: { callerName?: string; insurance?: string; state?: string }) => void
}

const ANALYSIS_INTERVAL = 15000
const MIN_TRANSCRIPT_FOR_ANALYSIS = 50

const SYSTEM_PROMPT = `You are an AI assistant for a substance abuse helpline agent. Your role is to provide real-time guidance during active calls.

CRITICAL CONTEXT:
- This is a phone helpline for substance abuse treatment
- Agents need to qualify callers for treatment programs
- You provide suggestions, NOT QA evaluations
- Be concise and actionable

Your job is to analyze the conversation transcript and provide:

1. SUGGESTIONS - What the agent should do next based on the conversation flow
2. WARNINGS - Any concerning patterns (resistance, crisis indicators, compliance issues)
3. DISPOSITION - Preliminary recommendation on how to categorize/end this call

Rules:
- Keep insights SHORT (under 100 characters for message)
- Be actionable and specific
- Flag crisis language immediately (suicide, self-harm, overdose)
- Suggest next steps when caller is ready
- Never repeat the same insight twice

Respond ONLY with valid JSON in this format (no markdown, no explanation):
{"insights":[{"type":"suggestion|warning|disposition","title":"Brief title","message":"Concise actionable message","priority":"high|medium|low"}],"suggestedDisposition":"qualified|not_qualified|follow_up|transfer_988|unclassified"}`

function buildAnalysisPrompt(transcript: string, callerName?: string, insurance?: string, state?: string): string {
  const lines = transcript.split('\n').filter(l => l.trim())
  const speakerSummary = lines.map(l => {
    if (l.startsWith('Agent:')) return `Agent: ${l.substring(7).trim()}`
    if (l.startsWith('Caller:')) return `Caller: ${l.substring(8).trim()}`
    return l
  }).join('\n')

  return `Analyze this helpline call transcript and provide real-time guidance.

CALLER CONTEXT:
${callerName ? `- Caller name: ${callerName}` : '- Caller name: Unknown'}
${insurance ? `- Insurance mentioned: ${insurance}` : '- Insurance: Not yet discussed'}
${state ? `- State: ${state}` : '- State: Not yet confirmed'}

CONVERSATION:
${speakerSummary}

Provide your analysis now.`
}

function parseAIResponse(content: string): { insights: LiveAIInsight[], suggestedDisposition: string | null } {
  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    
    const insights: LiveAIInsight[] = (parsed.insights || []).map((i: any, idx: number) => ({
      id: `ai-${Date.now()}-${idx}`,
      type: i.type || 'insight',
      title: i.title || 'Insight',
      message: i.message || '',
      priority: i.priority || 'medium',
      timestamp: Date.now(),
    }))

    return {
      insights,
      suggestedDisposition: parsed.suggestedDisposition || null,
    }
  } catch {
    return { insights: [], suggestedDisposition: null }
  }
}

function checkCrisis(transcript: string): LiveAIInsight | null {
  const crisisPatterns = [
    { pattern: /suicide|suicidal/i, title: 'Crisis Detected', message: 'Immediate transfer to 988 Suicide & Crisis Lifeline required' },
    { pattern: /kill myself|i'm going to die|end it all/i, title: 'Crisis Detected', message: 'Escalate immediately - caller expressing suicidal intent' },
    { pattern: /overdose|od'd|took too many/i, title: 'Medical Emergency', message: 'Caller may have overdosed - advise calling 911' },
    { pattern: /relapse|started using again|i used/i, title: 'Relapse Support', message: 'Offer support without judgment - focus on next steps' },
  ]

  for (const { pattern, title, message } of crisisPatterns) {
    if (pattern.test(transcript)) {
      return {
        id: `crisis-${Date.now()}`,
        type: 'warning',
        title,
        message,
        priority: 'high',
        timestamp: Date.now(),
      }
    }
  }
  return null
}

export function useLiveAIInsights(options: UseLiveAIInsightsOptions = {}): UseLiveAIInsightsReturn {
  const { onError, callId, callPhone, callDirection, callTimestamp } = options
  const [aiInsights, setAiInsights] = useState<LiveAIInsight[]>([])
  const [suggestedDisposition, setSuggestedDisposition] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<number | null>(null)

  const transcriptRef = useRef<string>('')
  const lastAnalysisRef = useRef<number>(0)
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const analyzeTranscript = useCallback(async (transcript: string, context?: { callerName?: string; insurance?: string; state?: string }) => {
    if (transcript.length < MIN_TRANSCRIPT_FOR_ANALYSIS) return
    if (Date.now() - lastAnalysisRef.current < ANALYSIS_INTERVAL) return

    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    setIsAnalyzing(true)
    lastAnalysisRef.current = Date.now()

    try {
      const response = await fetch('/api/openrouter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildAnalysisPrompt(transcript, context?.callerName, context?.insurance, context?.state) },
          ],
          max_tokens: 800,
          temperature: 0.3,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      const { insights: newInsights, suggestedDisposition: disposition } = parseAIResponse(content)

      const crisisInsight = checkCrisis(transcript)

      setAiInsights(prev => {
        const existingIds = new Set(prev.map(i => i.title))
        const uniqueNew = newInsights.filter(i => !existingIds.has(i.title))
        const combined = crisisInsight ? [crisisInsight, ...uniqueNew] : uniqueNew
        return combined.slice(0, 20)
      })

      if (disposition) {
        setSuggestedDisposition(disposition)
      }

      setLastAnalyzedAt(Date.now())

      // Save to Supabase log
      try {
        await fetch('/api/live-analysis-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callId,
            callPhone,
            callDirection,
            callTimestamp,
            suggestedDisposition: disposition,
            insights: [...newInsights, ...(crisisInsight ? [crisisInsight] : [])],
            transcriptPreview: transcript.slice(-500),
          }),
        })
      } catch (logError) {
        console.warn('[LiveAIInsights] Failed to save log:', logError)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'AI analysis failed'
      console.error('[LiveAIInsights]', message)
      onError?.(message)
    } finally {
      setIsAnalyzing(false)
    }
  }, [onError, callId, callPhone, callDirection, callTimestamp])

  const resetInsights = useCallback(() => {
    setAiInsights([])
    setSuggestedDisposition(null)
    setLastAnalyzedAt(null)
    transcriptRef.current = ''
    lastAnalysisRef.current = 0
  }, [])

  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current)
      }
      abortControllerRef.current?.abort()
    }
  }, [])

  return {
    aiInsights,
    suggestedDisposition,
    isAnalyzing,
    lastAnalyzedAt,
    resetInsights,
    analyzeNow: analyzeTranscript,
  }
}
