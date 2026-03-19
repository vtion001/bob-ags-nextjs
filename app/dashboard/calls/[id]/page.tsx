'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ScoreCircle from '@/components/ScoreCircle'
import { Call } from '@/lib/ctm'

export default function CallDetailPage() {
  const params = useParams()
  const router = useRouter()
  const callId = params.id as string
  const [call, setCall] = useState<Call | null>(null)
  const [transcript, setTranscript] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCallDetails = async () => {
      try {
        const res = await fetch(`/api/ctm/calls/${callId}`)
        if (!res.ok) throw new Error('Call not found')
        const data = await res.json()
        setCall(data.call)

        const transcriptRes = await fetch(`/api/ctm/calls/${callId}/transcript`)
        if (transcriptRes.ok) {
          const transcriptData = await transcriptRes.json()
          setTranscript(transcriptData.transcript || '')
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
            <ScoreCircle score={call.score || 0} size="md" />
          </Card>

          <Card className="mt-6 p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-4">Caller Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 uppercase">Phone</p>
                <p className="text-white font-mono mt-1">{call.phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Duration</p>
                <p className="text-white mt-1">{formatDuration(call.duration)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Direction</p>
                <p className="text-white capitalize mt-1">{call.direction}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Status</p>
                <p className="text-cyan-400 capitalize mt-1">{call.status}</p>
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
          {call.analysis && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">AI Analysis</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">Sentiment</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    call.analysis.sentiment === 'positive' ? 'bg-green-500/20 text-green-400' :
                    call.analysis.sentiment === 'negative' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {call.analysis.sentiment}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Summary</p>
                  <p className="text-white">{call.analysis.summary}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {call.analysis.tags.map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400 mb-2">Suggested Disposition</p>
                  <p className="text-white bg-navy-900/50 rounded-lg p-3">{call.analysis.disposition}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Audio Player */}
          {call.recordingUrl && (
            <Card className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Recording</h3>
              <audio 
                controls 
                className="w-full h-12 bg-navy-900 rounded-lg"
                src={call.recordingUrl}
              >
                Your browser does not support audio playback.
              </audio>
            </Card>
          )}

          {/* Transcript */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Transcript</h3>
            {transcript ? (
              <div className="bg-navy-900/50 rounded-lg p-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {transcript}
              </div>
            ) : (
              <div className="bg-navy-900/50 rounded-lg p-4 text-slate-500 text-sm">
                No transcript available. {call.recordingUrl && 'Enable transcription in settings.'}
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
