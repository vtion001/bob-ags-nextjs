'use client'

import React, { useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import {
  CallScoreCard,
  CallerInfoCard,
  AIAnalysisCard,
  QAAnalysisCard,
  QAManualOverrideCard,
  TranscriptCard,
  AudioPlayerCard,
  ActionButtonsCard,
} from '@/components/call-detail'
import { useCallDetail } from '@/hooks/calls/useCallDetail'
import { useAuth } from '@/contexts/AuthContext'

export default function CallDetailPage() {
  const params = useParams()
  const router = useRouter()
  const callId = params.id as string
  const { role } = useAuth()

  const {
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
    setAnalysis,
  } = useCallDetail(callId)

  const handleOverrideSaved = useCallback((overrides: any[], manualScore: number) => {
    if (analysis) {
      setAnalysis({
        ...analysis,
        score: manualScore,
      })
    }
  }, [analysis, setAnalysis])

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

  const hasTranscript = !!transcript
  const hasAnalysis = !!analysis?.rubric_results?.length

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        ← Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <div className="lg:col-span-2 space-y-6">
          <AIAnalysisCard
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            call={call}
          />

          <QAAnalysisCard
            rubricResults={analysis?.rubric_results}
            rubricBreakdown={analysis?.rubric_breakdown}
            isAnalyzing={isAnalyzing}
            hasTranscript={hasTranscript}
            onRunAnalysis={async () => { await handleAnalyze() }}
          />

          <QAManualOverrideCard
            callId={callId}
            rubricResults={analysis?.rubric_results}
            rubricBreakdown={analysis?.rubric_breakdown}
            onOverrideSaved={(overrides) => {
              console.log('Overrides saved:', overrides)
            }}
          />

          <AudioPlayerCard
            audioUrl={call.recordingUrl || ''}
            callId={call.id}
            callStatus={call.status}
          />

          <TranscriptCard
            transcript={transcript}
            transcriptError={transcriptError}
            isTranscribing={isTranscribing}
            hasRecording={!!call.recordingUrl}
            onTranscribe={handleTranscribe}
          />

          <ActionButtonsCard
            onCreateTask={() => console.log('Create task for call:', callId)}
            onAddToSalesforce={() => console.log('Add to Salesforce:', callId)}
            onScheduleFollowUp={() => console.log('Schedule follow-up for call:', callId)}
          />
        </div>
      </div>
    </div>
  )
}
