'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import {
  CallScoreCard,
  CallerInfoCard,
  AIAnalysisCard,
  TranscriptCard,
  AudioPlayerCard,
  ActionButtonsCard,
} from '@/components/call-detail'
import { Call } from '@/lib/ctm'

interface AnalysisResult {
  score: number
  sentiment: string
  summary: string
  tags: string[]
  disposition: string
}

export default function CallDetailPage() {
  const params = useParams()
  const router = useRouter()
  const callId = params.id as string

  const [call, setCall] = useState<Call | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const [transcriptError, setTranscriptError] = useState<string | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCallDetails = async () => {
    try {
      const res = await fetch(`/api/calls?ctmCallId=${callId}&skipSync=true`)
      if (!res.ok) throw new Error('Call not found')
      const data = await res.json()
      if (data.calls && data.calls.length > 0) {
        return data.calls[0]
      }
      throw new Error('Call not found')
    } catch (err) {
      throw err
    }
  }

  const handleTranscribe = async () => {
    setTranscriptError(null)
    setIsTranscribing(true)
    try {
      const res = await fetch(`/api/ctm/calls/${callId}/transcript`)
      const data = await res.json()
      
      if (data.transcript) {
        setTranscript(data.transcript)
        return true
      } else if (data.error) {
        setTranscriptError(data.error + (data.details ? `: ${data.details}` : ''))
        return false
      }
      return false
    } catch (err) {
      setTranscriptError('Failed to transcribe audio')
      return false
    } finally {
      setIsTranscribing(false)
    }
  }

  const handleAnalyze = async () => {
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
          setAnalysis(result.analysis)
          return true
        }
      }
      return false
    } catch (err) {
      console.error('Analysis failed:', err)
      return false
    } finally {
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      try {
        const fetchedCall = await fetchCallDetails()
        setCall(fetchedCall)
        
        if (fetchedCall.score !== undefined || fetchedCall.sentiment) {
          setAnalysis({
            score: fetchedCall.score || 0,
            sentiment: fetchedCall.sentiment || 'neutral',
            summary: fetchedCall.summary || '',
            tags: fetchedCall.tags || [],
            disposition: fetchedCall.disposition || ''
          })
        }

        if (fetchedCall.transcript) {
          setTranscript(fetchedCall.transcript)
        } else if (fetchedCall.recordingUrl) {
          setIsTranscribing(true)
          const transcribed = await handleTranscribe()
          
          if (transcribed && !fetchedCall.score && !fetchedCall.sentiment) {
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
  }, [callId])

  const onTranscribe = async () => {
    await handleTranscribe()
  }

  const onCreateTask = () => {
    console.log('Create task for call:', callId)
  }

  const onAddToSalesforce = () => {
    console.log('Add to Salesforce:', callId)
  }

  const onScheduleFollowUp = () => {
    console.log('Schedule follow-up for call:', callId)
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          ← Back
        </Button>
        <Card className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-navy-100 border-t-navy-900 rounded-full animate-spin" />
            <p className="text-slate-400">Loading call details...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (error || !call) {
    return (
      <div className="p-6 lg:p-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          ← Back
        </Button>
        <Card className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-400">{error || 'Call not found'}</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        ← Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-6">
          <CallScoreCard 
            score={analysis?.score || call.score || 0}
            sentiment={analysis?.sentiment}
          />
          <CallerInfoCard call={call} />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1">
              Export
            </Button>
            <Button variant="secondary" size="sm" className="flex-1">
              Notes
            </Button>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          <AIAnalysisCard 
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            call={call}
          />
          
          <AudioPlayerCard 
            audioUrl={call.recordingUrl || ''}
            callId={call.id}
          />
          
          <TranscriptCard
            transcript={transcript}
            transcriptError={transcriptError}
            isTranscribing={isTranscribing}
            hasRecording={!!call.recordingUrl}
            onTranscribe={onTranscribe}
          />
          
          <ActionButtonsCard
            onCreateTask={onCreateTask}
            onAddToSalesforce={onAddToSalesforce}
            onScheduleFollowUp={onScheduleFollowUp}
          />
        </div>
      </div>
    </div>
  )
}
