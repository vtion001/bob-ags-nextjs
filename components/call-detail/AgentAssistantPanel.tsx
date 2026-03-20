'use client'

import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import { getAgentSuggestions, type AgentSuggestion } from '@/lib/rag/suggestions'

interface AgentAssistantPanelProps {
  missingCriteria: string[]
  currentContext: {
    insurance?: string
    state?: string
    substance?: string
    callerName?: string
    isCrisis?: boolean
  }
  lastTranscript?: string
}

export default function AgentAssistantPanel({ missingCriteria, currentContext, lastTranscript }: AgentAssistantPanelProps) {
  const [suggestions, setSuggestions] = useState<AgentSuggestion[]>([])
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const newSuggestions = getAgentSuggestions({
      missingCriteria,
      currentContext,
      limit: 6,
    })
    setSuggestions(newSuggestions)
  }, [missingCriteria, currentContext, lastTranscript])

  const getTypeIcon = (type: AgentSuggestion['type']) => {
    switch (type) {
      case 'script':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      case 'transfer':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        )
      case 'reminder':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getPriorityColor = (priority: AgentSuggestion['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getTypeColor = (type: AgentSuggestion['type']) => {
    switch (type) {
      case 'script':
        return 'text-navy-600'
      case 'warning':
        return 'text-red-600'
      case 'transfer':
        return 'text-green-600'
      case 'reminder':
        return 'text-blue-600'
    }
  }

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
          {suggestions.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${suggestions.some(s => s.priority === 'high') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}
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
        <div className="max-h-80 overflow-y-auto divide-y divide-navy-100">
          {suggestions.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-green-600 font-medium">All criteria met!</p>
              <p className="text-navy-500 text-sm mt-1">Call is proceeding well.</p>
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-4 border-l-4 ${suggestion.priority === 'high' ? 'border-l-red-500' : suggestion.priority === 'medium' ? 'border-l-amber-500' : 'border-l-blue-500'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${getTypeColor(suggestion.type)}`}>
                    {getTypeIcon(suggestion.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-navy-900">{suggestion.title}</p>
                      {suggestion.criterion && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-navy-100 text-navy-600 rounded font-mono">
                          {suggestion.criterion}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-navy-600">{suggestion.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Card>
  )
}