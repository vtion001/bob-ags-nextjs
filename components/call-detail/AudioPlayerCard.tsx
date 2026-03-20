import React from 'react'
import Card from '@/components/ui/Card'

interface AudioPlayerCardProps {
  audioUrl: string
  callId: string
  callStatus?: string
}

export default function AudioPlayerCard({ audioUrl, callId, callStatus }: AudioPlayerCardProps) {
  if (!audioUrl) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-navy-900 mb-4">Recording</h3>
        <div className="bg-navy-50 rounded-lg p-4 text-center">
          <svg className="w-10 h-10 text-navy-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <p className="text-navy-500 text-sm font-medium">No recording available</p>
          <p className="text-navy-400 text-xs mt-1">
            {callStatus === 'active' 
              ? 'Recording will be available once the call completes and is processed by CTM.'
              : 'This call may not have been recorded. Check CTM settings to enable call recordings.'}
          </p>
        </div>
      </Card>
    )
  }

  const audioSrc = audioUrl.startsWith('/') ? `/api/ctm/calls/${callId}/audio` : audioUrl

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-navy-900 mb-4">Recording</h3>
      <audio 
        controls 
        className="w-full h-12"
        src={audioSrc}
      >
        Your browser does not support audio playback.
      </audio>
    </Card>
  )
}
