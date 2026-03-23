'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Card from '@/components/ui/Card'
import { type LiveAIInsight } from '@/hooks/monitor/useLiveAIInsights'

interface AgentAssistantPanelProps {
  aiInsights?: LiveAIInsight[]
  transcript?: { speaker: string; text: string }[]
  callerName?: string
  isCrisis?: boolean
}

export default function AgentAssistantPanel({
  aiInsights,
  transcript = [],
  callerName,
  isCrisis,
}: AgentAssistantPanelProps) {
  const [expanded, setExpanded] = useState(true)

  const conversationSummary = useMemo(() => {
    if (transcript.length === 0) return null

    const agentLines = transcript.filter(t => t.speaker === 'Agent').slice(-5)
    const callerLines = transcript.filter(t => t.speaker === 'Caller').slice(-5)

    return {
      agentLast: agentLines[agentLines.length - 1]?.text || '',
      callerLast: callerLines[callerLines.length - 1]?.text || '',
      agentCount: agentLines.length,
      callerCount: callerLines.length,
    }
  }, [transcript])

  const prioritizedInsights = useMemo(() => {
    const insights = aiInsights || []
    const high = insights.filter(i => i.priority === 'high')
    const medium = insights.filter(i => i.priority === 'medium')
    const low = insights.filter(i => i.priority === 'low')
    return [...high, ...medium, ...low].slice(0, 8)
  }, [aiInsights])

  const getTypeIcon = (type: LiveAIInsight['type']) => {
    switch (type) {
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'disposition':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'suggestion':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
    }
  }

  const getTypeColor = (type: LiveAIInsight['type']) => {
    switch (type) {
      case 'warning':
        return 'text-navy-700 bg-navy-100 border-navy-200'
      case 'disposition':
        return 'text-navy-700 bg-navy-100 border-navy-200'
      case 'suggestion':
        return 'text-navy-700 bg-navy-100 border-navy-200'
      default:
        return 'text-navy-700 bg-navy-100 border-navy-200'
    }
  }

  const hasHighPriority = prioritizedInsights.some(i => i.priority === 'high')

  return (
    <Card className="p-0 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-navy-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-lg font-bold text-navy-900">AI Agent Assistant</h3>
          {prioritizedInsights.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${hasHighPriority ? 'bg-navy-900 text-white' : 'bg-navy-200 text-navy-700'}`}>
              {prioritizedInsights.length} suggestion{prioritizedInsights.length > 1 ? 's' : ''}
            </span>
          )}
          {isCrisis && (
            <span className="px-2 py-0.5 bg-navy-900 text-white text-xs rounded-full font-bold animate-pulse">
              CRISIS
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-navy-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="max-h-96 overflow-y-auto divide-y divide-navy-100">
          {prioritizedInsights.length === 0 ? (
            <div className="p-4 text-center">
              {transcript.length === 0 ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-navy-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-navy-700 font-medium">Ready to assist</p>
                  <p className="text-navy-500 text-sm mt-1">
                    AI suggestions will appear as the conversation progresses
                  </p>
                </>
              ) : conversationSummary?.agentCount && conversationSummary.agentCount < 3 ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-navy-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-navy-700 font-medium">Listening to conversation...</p>
                  <p className="text-navy-500 text-sm mt-1">
                    {conversationSummary.agentCount} agent utterance{conversationSummary.agentCount !== 1 ? 's' : ''} detected
                  </p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 text-navy-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-navy-700 font-medium">Call proceeding well</p>
                  <p className="text-navy-500 text-sm mt-1">
                    Continue building rapport and gather qualifying information
                  </p>
                </>
              )}
            </div>
          ) : (
            prioritizedInsights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 border-l-4 ${insight.priority === 'high' ? 'border-l-navy-900' : insight.priority === 'medium' ? 'border-l-navy-600' : 'border-l-navy-400'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-lg ${getTypeColor(insight.type)}`}>
                    {getTypeIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-navy-900">{insight.title}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                        insight.type === 'warning' ? 'bg-navy-200 text-navy-800' :
                        insight.type === 'disposition' ? 'bg-navy-200 text-navy-800' :
                        insight.type === 'suggestion' ? 'bg-navy-200 text-navy-800' :
                        'bg-navy-200 text-navy-800'
                      }`}>
                        {insight.type}
                      </span>
                    </div>
                    <p className="text-sm text-navy-700">{insight.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}

          {callerName && (
            <div className="px-4 py-2 bg-navy-50 text-xs text-navy-500">
              Caller: <span className="font-medium text-navy-700">{callerName}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
