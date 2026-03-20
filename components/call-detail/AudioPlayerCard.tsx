import React from 'react'
import Card from '@/components/ui/Card'

interface AudioPlayerCardProps {
  audioUrl: string
  callId: string
}

export default function AudioPlayerCard({ audioUrl, callId }: AudioPlayerCardProps) {
  if (!audioUrl) {
    return null
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
