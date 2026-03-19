'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ScoreCircle from '@/components/ScoreCircle'
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
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCallDetails = async () => {
      try {
        const res = await fetch(`/api/ctm/calls/${callId}`)
        if (!res.ok) throw new Error('Call not found')
        const data = await res.json()
        setCall(data.call)
        
        if (data.call.analysis) {
          setAnalysis(data.call.analysis)
        }

        const transcriptRes = await fetch(`/api/ctm/calls/${callId}/transcript`)
        if (transcriptRes.ok) {
          const transcriptData = await transcriptRes.json()
          if (transcriptData.transcript) {
            setTranscript(transcriptData.transcript)
            if (!data.call.analysis) {
              setIsAnalyzing(true)
              try {
                const analyzeRes = await fetch('/api/ctm/calls/analyze', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ callIds: [callId] }),
                })
                if (analyzeRes.ok) {
                  const analyzeData = await analyzeRes.json()
                  const result = analyzeData.results?.[0]
                  if (result?.success && result.analysis) {
                    setAnalysis(result.analysis)
                  }
                }
              } catch (err) {
                console.error('Analysis failed:', err)
              } finally {
                setIsAnalyzing(false)
              }
            }
          } else if (transcriptData.error) {
            setTranscriptError(transcriptData.error)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    fetchCallDetails()
  }, [callId])

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          ← Back
        </Button>
        <Card className="text-center py-12">
          <p className="text-slate-400">Loading...</p>
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
          <p className="text-slate-400">{error || 'Call not found'}</p>
        </Card>
      </div>
    )
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const displayScore = analysis?.score || call.score || 0

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        ← Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Score and basic info */}
        <div className="lg:col-span-1">
          <Card className="flex flex-col items-center p-8 text-center">
            <ScoreCircle score={displayScore} size="md" />
          </Card>

          <Card className="mt-6 p-6">
            <h3 className="text-sm font-semibold text-navy-500 mb-4">Caller Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-navy-400 uppercase">Phone</p>
                <p className="text-navy-900 font-mono mt-1">{call.phone}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 uppercase">Duration</p>
                <p className="text-navy-900 mt-1">{formatDuration(call.duration)}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 uppercase">Direction</p>
                <p className="text-navy-900 capitalize mt-1">{call.direction}</p>
              </div>
              <div>
                <p className="text-xs text-navy-400 uppercase">Status</p>
                <p className="text-emerald-600 capitalize mt-1">{call.status}</p>
              </div>
            </div>
          </Card>

          <div className="flex gap-2 mt-6">
            <Button variant="secondary" size="sm" className="flex-1">
              Export
            </Button>
            <Button variant="secondary" size="sm" className="flex-1">
              Notes
            </Button>
          </div>
        </div>

        {/* Right column - Analysis and transcript */}
        <div className="lg:col-span-2 space-y-6">
          {/* Analysis */}
          {(analysis || call?.analysis) && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-navy-900 mb-4">
                AI Analysis {isAnalyzing && <span className="text-navy-400 text-sm font-normal">(Analyzing...)</span>}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-navy-500 mb-2">Score</p>
                  <ScoreCircle score={analysis?.score || call?.score || 0} size="sm" />
                </div>

                <div>
                  <p className="text-sm text-navy-500 mb-2">Sentiment</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    (analysis?.sentiment || call?.analysis?.sentiment) === 'positive' ? 'bg-green-100 text-green-700' :
                    (analysis?.sentiment || call?.analysis?.sentiment) === 'negative' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {analysis?.sentiment || call?.analysis?.sentiment || 'unknown'}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-navy-500 mb-2">Summary</p>
                  <p className="text-navy-800">{analysis?.summary || call?.analysis?.summary || 'No summary available'}</p>
                </div>

                <div>
                  <p className="text-sm text-navy-500 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {(analysis?.tags || call?.analysis?.tags || []).map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-navy-100 text-navy-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-navy-500 mb-2">Suggested Disposition</p>
                  <p className="text-navy-800 bg-navy-50 rounded-lg p-3">
                    {(analysis?.disposition && analysis.disposition !== '-------- dup unq --------') 
                      ? analysis.disposition 
                      : call?.analysis?.disposition && call.analysis.disposition !== '-------- dup unq --------'
                        ? call.analysis.disposition
                        : 'No disposition available'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Audio Player */}
          {call.recordingUrl && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-navy-900 mb-4">Recording</h3>
              <audio 
                controls 
                className="w-full h-12"
                src={`/api/ctm/calls/${call.id}/audio`}
              >
                Your browser does not support audio playback.
              </audio>
            </Card>
          )}

          {/* Transcript */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-navy-900 mb-4">Transcript</h3>
            {transcript ? (
              <div className="bg-navy-50 rounded-lg p-4 text-navy-700 text-sm leading-relaxed whitespace-pre-wrap">
                {transcript}
              </div>
            ) : transcriptError ? (
              <div className="bg-amber-50 rounded-lg p-4 text-amber-700 text-sm">
                {transcriptError}
              </div>
            ) : (
              <div className="bg-navy-50 rounded-lg p-4 text-navy-400 text-sm">
                No transcript available.
              </div>
            )}
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="md">
              Create Task
            </Button>
            <Button variant="secondary" size="md">
              Add to Salesforce
            </Button>
            <Button variant="ghost" size="md">
              Schedule Follow-up
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
