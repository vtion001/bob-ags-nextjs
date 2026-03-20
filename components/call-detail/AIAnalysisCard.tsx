import React from 'react'
import Card from '@/components/ui/Card'
import ScoreCircle from '@/components/ScoreCircle'

interface AnalysisResult {
  score: number
  sentiment: string
  summary: string
  tags: string[]
  disposition: string
}

interface AIAnalysisCardProps {
  analysis: AnalysisResult | null
  isAnalyzing: boolean
  call?: {
    callerNumber?: string
    city?: string
    state?: string
    trackingLabel?: string
  }
}

export default function AIAnalysisCard({ analysis, isAnalyzing, call }: AIAnalysisCardProps) {
  const getSentimentStyles = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-700'
      case 'negative':
        return 'bg-red-100 text-red-700'
      case 'neutral':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-slate-100 text-slate-600'
    }
  }

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'Hot Lead'
      case 'neutral': return 'Warm Lead'
      case 'negative': return 'Cold Lead'
      default: return 'Unknown'
    }
  }

  const cleanDisposition = (disposition: string) => {
    if (disposition === '-------- dup unq --------' || !disposition) {
      return null
    }
    return disposition
  }

  if (!analysis) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-navy-900 mb-4">
          AI Analysis
        </h3>
        <div className="bg-navy-50 rounded-lg p-4 text-navy-500 text-center">
          No analysis available. Transcription will trigger auto-analysis.
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-navy-900 mb-4">
        AI Analysis {isAnalyzing && (
          <span className="text-navy-400 text-sm font-normal">(Analyzing...)</span>
        )}
      </h3>
      
      <div className="space-y-4">
        {/* Score */}
        <div>
          <p className="text-sm text-navy-500 mb-2">Score</p>
          <div className="flex items-center gap-4">
            <ScoreCircle score={analysis.score} size="sm" />
            <div>
              <p className="text-2xl font-bold text-navy-900">{analysis.score}</p>
              <p className="text-sm text-navy-500">out of 100</p>
            </div>
          </div>
        </div>

        {/* Sentiment */}
        <div>
          <p className="text-sm text-navy-500 mb-2">Sentiment</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getSentimentStyles(analysis.sentiment)}`}>
            {getSentimentLabel(analysis.sentiment)} - {analysis.sentiment}
          </span>
        </div>

        {/* Summary */}
        <div>
          <p className="text-sm text-navy-500 mb-2">Summary</p>
          <p className="text-navy-800 bg-navy-50 rounded-lg p-3">
            {analysis.summary || 'No summary available'}
          </p>
        </div>

        {/* Tags */}
        {analysis.tags && analysis.tags.length > 0 && (
          <div>
            <p className="text-sm text-navy-500 mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {analysis.tags.map((tag: string, index: number) => (
                <span 
                  key={`${tag}-${index}`} 
                  className="px-3 py-1 bg-navy-100 text-navy-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Disposition */}
        {cleanDisposition(analysis.disposition) && (
          <div>
            <p className="text-sm text-navy-500 mb-2">Suggested Disposition</p>
            <div className="text-navy-800 bg-navy-50 rounded-lg p-3 space-y-2">
              <p>{cleanDisposition(analysis.disposition)}</p>
              {call?.callerNumber && (
                <p className="text-xs text-navy-400">
                  Caller: {call.callerNumber}
                  {call.city && call.state && ` • ${call.city}, ${call.state}`}
                  {call.trackingLabel && ` • ${call.trackingLabel}`}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
