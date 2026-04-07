import React from 'react'
import Card from '@/components/ui/Card'
import ScoreCircle from '@/components/call-detail/ScoreCircle'

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
  onAnalyze?: () => void
  call?: {
    callerNumber?: string
    city?: string
    state?: string
    trackingLabel?: string
  }
}

export default function AIAnalysisCard({ analysis, isAnalyzing, onAnalyze, call }: AIAnalysisCardProps) {
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
        <div className="bg-navy-50 rounded-lg p-6 text-center">
          <svg className="w-10 h-10 text-navy-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          {isAnalyzing ? (
            <>
              <p className="text-navy-600 font-medium mb-1">Analyzing call...</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="w-4 h-4 border-2 border-navy-300 border-t-navy-600 rounded-full animate-spin" />
                <span className="text-navy-400 text-sm">Processing with AI</span>
              </div>
            </>
          ) : (
            <>
              <p className="text-navy-600 font-medium mb-1">No analysis available</p>
              <p className="text-navy-400 text-sm mb-4">
                Analysis requires a recording to be available. Once CTM processes the call recording, analysis will be automatically generated.
              </p>
              {onAnalyze && (
                <button
                  onClick={onAnalyze}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Run AI Analysis
                </button>
              )}
            </>
          )}
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
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              analysis.sentiment === 'positive'
                ? 'bg-green-100 text-green-700'
                : analysis.sentiment === 'negative'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-navy-100 text-navy-700'
            }`}>
              {analysis.sentiment === 'positive' ? 'Positive' : analysis.sentiment === 'negative' ? 'Negative' : 'Neutral'}
            </span>
            <span className="text-sm text-navy-400">
              {analysis.sentiment === 'positive' ? '— Warm Lead' : analysis.sentiment === 'negative' ? '— Cold Lead' : '— Unknown'}
            </span>
          </div>
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
