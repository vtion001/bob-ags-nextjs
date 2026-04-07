import React from 'react'
import ScoreCircle from '@/components/call-detail/ScoreCircle'
import Card from '@/components/ui/Card'

interface CallScoreCardProps {
  score: number
  sentiment?: string
}

export default function CallScoreCard({ score, sentiment }: CallScoreCardProps) {
  const getSentimentLabel = (sentiment: string | undefined) => {
    switch (sentiment) {
      case 'positive': return 'Hot'
      case 'neutral': return 'Warm'
      case 'negative': return 'Cold'
      default: return 'Unknown'
    }
  }

  return (
    <Card className="flex flex-col items-center p-8 text-center">
      <ScoreCircle score={score} size="md" />
      <div className="mt-4">
        <p className="text-sm text-navy-500">Classification</p>
        <p className="text-lg font-semibold text-navy-900">
          {getSentimentLabel(sentiment)}
        </p>
      </div>
    </Card>
  )
}
