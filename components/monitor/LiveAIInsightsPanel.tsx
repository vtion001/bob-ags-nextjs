'use client'

import React, { useDeferredValue, useMemo } from 'react'
import CollapsiblePanel from '@/components/ui/CollapsiblePanel'
import type { LiveAIInsight } from '@/hooks/monitor/useLiveAIInsights'

interface LiveAIInsightsPanelProps {
  insights: LiveAIInsight[]
  suggestedDisposition: string | null
  isAnalyzing: boolean
  expanded: boolean
  onToggle: () => void
}

function getInsightColor(type: LiveAIInsight['type']): string {
  switch (type) {
    case 'warning':
      return 'bg-navy-50 border-navy-200'
    case 'disposition':
      return 'bg-navy-100 border-navy-200'
    case 'suggestion':
      return 'bg-navy-50 border-navy-200'
    default:
      return 'bg-navy-50 border-navy-200'
  }
}

function getInsightIcon(type: LiveAIInsight['type']): string {
  switch (type) {
    case 'warning':
      return '!'
    case 'disposition':
      return 'D'
    case 'suggestion':
      return '→'
    default:
      return 'i'
  }
}

function getPriorityBadge(priority: LiveAIInsight['priority']): string {
  switch (priority) {
    case 'high':
      return 'bg-navy-900 text-white'
    case 'medium':
      return 'bg-navy-700 text-white'
    case 'low':
      return 'bg-navy-500 text-white'
  }
}

function formatDisposition(disposition: string): string {
  const map: Record<string, string> = {
    qualified: 'Qualified - Ready for Transfer',
    not_qualified: 'Not Qualified - Provide Resources',
    follow_up: 'Follow-up Required',
    transfer_988: 'Transfer to 988 Lifeline',
    unclassified: 'Insufficient Data',
  }
  return map[disposition] || disposition
}

function AIIcon() {
  return (
    <svg
      className="w-5 h-5 text-navy-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  )
}

export default function LiveAIInsightsPanel({
  insights,
  suggestedDisposition,
  isAnalyzing,
  expanded,
  onToggle,
}: LiveAIInsightsPanelProps) {
  const deferredInsights = useDeferredValue(insights)
  const isStale = deferredInsights !== insights

  const sortedInsights = useMemo(() => {
    return [...deferredInsights].sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1)
    })
  }, [deferredInsights])

  return (
    <CollapsiblePanel
      title="AI Recommendations"
      icon={<AIIcon />}
      expanded={expanded}
      onToggle={onToggle}
      rightElement={
        <div className="flex items-center gap-2">
          {isAnalyzing && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-navy-100 text-navy-700 text-xs rounded-full">
              <span className="w-1.5 h-1.5 bg-navy-500 rounded-full animate-pulse" />
              Analyzing
            </span>
          )}
          {insights.length > 0 && (
            <span className="px-2 py-0.5 bg-navy-900 text-white text-xs rounded-full">
              {insights.length}
            </span>
          )}
        </div>
      }
    >
      <div className="max-h-80 overflow-y-auto divide-y divide-navy-100">
        {suggestedDisposition && (
          <div className="px-4 py-3 bg-navy-50 border-b border-navy-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-navy-700 uppercase tracking-wide">
                Suggested Disposition
              </span>
            </div>
            <p className="text-sm font-semibold text-navy-900">
              {formatDisposition(suggestedDisposition)}
            </p>
          </div>
        )}

        {sortedInsights.length === 0 && !isAnalyzing ? (
          <div className="p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-navy-500 text-sm font-medium">
              AI insights will appear as the conversation progresses
            </p>
            <p className="text-navy-400 text-xs mt-1">
              Analyzing tone, context, and caller readiness
            </p>
          </div>
        ) : (
          sortedInsights.map((insight) => (
            <div
              key={insight.id}
              className={`px-4 py-3 flex items-start gap-3 ${getInsightColor(insight.type)}`}
            >
              <span
                className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  insight.type === 'warning'
                    ? 'bg-navy-900 text-white'
                    : insight.type === 'disposition'
                      ? 'bg-navy-700 text-white'
                      : insight.type === 'suggestion'
                        ? 'bg-navy-600 text-white'
                        : 'bg-navy-500 text-white'
                }`}
              >
                {getInsightIcon(insight.type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${getPriorityBadge(insight.priority)}`}>
                    {insight.priority.toUpperCase()}
                  </span>
                  <span className="text-sm font-semibold text-navy-900">
                    {insight.title}
                  </span>
                </div>
                <p className="text-sm text-navy-700">
                  {insight.message}
                </p>
              </div>
            </div>
          ))
        )}

        {isStale && (
          <div className="px-4 py-2 bg-navy-50 border-t border-navy-200">
            <p className="text-xs text-navy-400 italic">
              Updating insights...
            </p>
          </div>
        )}

        {isAnalyzing && sortedInsights.length === 0 && (
          <div className="p-4 text-center">
            <div className="w-8 h-8 border-2 border-navy-200 border-t-navy-600 rounded-full animate-spin mx-auto" />
            <p className="text-navy-600 text-sm mt-2 font-medium">Analyzing conversation...</p>
          </div>
        )}
      </div>
    </CollapsiblePanel>
  )
}
