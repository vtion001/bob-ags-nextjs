'use client'

import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Insight {
  id: string
  type: 'insight' | 'suggestion' | 'warning' | 'disposition'
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  timestamp: number
}

interface LogEntry {
  id: string
  call_id: string | null
  call_phone: string | null
  call_direction: string | null
  call_timestamp: string | null
  suggested_disposition: string | null
  insights: Insight[]
  transcript_preview: string | null
  created_at: string
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const isToday = date.toDateString() === today.toDateString()
  
  if (isToday) {
    return `Today at ${formatTime(dateStr)}`
  }
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function InsightBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    warning: 'bg-red-100 text-red-700',
    suggestion: 'bg-blue-100 text-blue-700',
    insight: 'bg-green-100 text-green-700',
    disposition: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-700'}`}>
      {type}
    </span>
  )
}

function PriorityIndicator({ priority }: { priority: string }) {
  if (priority === 'high') {
    return <span className="w-2 h-2 rounded-full bg-red-500" />
  }
  if (priority === 'medium') {
    return <span className="w-2 h-2 rounded-full bg-yellow-500" />
  }
  return <span className="w-2 h-2 rounded-full bg-green-500" />
}

export default function LiveAnalysisLogHistory() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedLog, setSelectedLog] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/live-analysis-logs?limit=50')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const clearLogs = async () => {
    if (!confirm('Clear all live analysis logs?')) return
    try {
      const res = await fetch('/api/live-analysis-logs', { method: 'DELETE' })
      if (res.ok) {
        setLogs([])
      }
    } catch (err) {
      console.error('Failed to clear logs:', err)
    }
  }

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="shadow-lg bg-white"
        >
          View Analysis History ({logs.length})
        </Button>
      </div>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 z-40 w-96 max-h-[60vh] overflow-hidden shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-navy-100">
        <h3 className="font-semibold text-navy-900">Analysis History</h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearLogs}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[calc(60vh-60px)] p-4">
        {isLoading ? (
          <div className="text-center py-8 text-navy-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-navy-400">
            No analysis history yet
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedLog === log.id 
                    ? 'border-navy-400 bg-navy-50' 
                    : 'border-navy-100 hover:border-navy-200'
                }`}
                onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PriorityIndicator priority={log.insights?.[0]?.priority || 'low'} />
                    <span className="text-sm font-medium text-navy-900">
                      {log.call_phone || 'Unknown'}
                    </span>
                  </div>
                  <span className="text-xs text-navy-400">
                    {formatDate(log.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  {log.suggested_disposition && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                      {log.suggested_disposition}
                    </span>
                  )}
                  <span className="text-xs text-navy-400">
                    {log.insights?.length || 0} insights
                  </span>
                </div>

                {selectedLog === log.id && (
                  <div className="mt-3 pt-3 border-t border-navy-100 space-y-2">
                    {log.insights?.map((insight) => (
                      <div key={insight.id} className="flex gap-2">
                        <InsightBadge type={insight.type} />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-navy-700">
                            {insight.title}
                          </div>
                          <div className="text-xs text-navy-500">
                            {insight.message}
                          </div>
                        </div>
                      </div>
                    ))}
                    {log.transcript_preview && (
                      <div className="mt-2 pt-2 border-t border-navy-100">
                        <div className="text-xs text-navy-400 mb-1">Transcript:</div>
                        <div className="text-xs text-navy-600 italic line-clamp-3">
                          {log.transcript_preview}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}