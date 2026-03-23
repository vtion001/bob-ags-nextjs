'use client'

import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'

interface CallNotes {
  callerName?: string
  callerPhone?: string
  state?: string
  insurance?: string
  substance?: string
  sobrietyTime?: string
  notes: string
  disposition: string
  followUpRequired: boolean
  suggestedTransfer?: string
}

interface NotesDispositionPanelProps {
  currentState: {
    callerName?: string
    callerPhone?: string
    state?: string
    insurance?: string
    substance?: string
    sobrietyTime?: string
    callerLocation?: string
  }
  score: number
  missingCriteria: string[]
  suggestedDisposition?: string | null
  aiNotes?: string | null
}

const DISPOSITIONS: Record<string, { label: string; color: string; description: string }> = {
  'qualified-transfer': {
    label: 'Qualified Transfer',
    color: 'bg-navy-900 text-white border-navy-900',
    description: 'Transfer to admissions'
  },
  'warm-lead': {
    label: 'Warm Lead',
    color: 'bg-navy-700 text-white border-navy-700',
    description: 'Schedule callback within 24h'
  },
  'informational': {
    label: 'Informational',
    color: 'bg-navy-500 text-white border-navy-500',
    description: 'Provide resources only'
  },
  'supervisor-review': {
    label: 'Supervisor Review',
    color: 'bg-navy-200 text-navy-900 border-navy-300',
    description: 'ZTP violation - immediate review'
  }
}

export default function NotesDispositionPanel({ currentState, score, missingCriteria, suggestedDisposition: aiSuggestedDisposition, aiNotes }: NotesDispositionPanelProps) {
  const [notes, setNotes] = useState('')
  const [selectedDisposition, setSelectedDisposition] = useState('')
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    if (aiSuggestedDisposition) {
      const dispositionMap: Record<string, string> = {
        qualified: 'qualified-transfer',
        not_qualified: 'informational',
        follow_up: 'warm-lead',
        transfer_988: 'supervisor-review',
      }
      const mapped = dispositionMap[aiSuggestedDisposition]
      if (mapped) {
        setSelectedDisposition(mapped)
      }
    }
  }, [aiSuggestedDisposition])

  useEffect(() => {
    if (aiNotes && !notes) {
      setNotes(aiNotes)
    }
  }, [aiNotes])

  useEffect(() => {
    if (aiSuggestedDisposition) return
    const hasZTP = missingCriteria.some(c => ['3.4', '5.1', '5.2'].includes(c))
    
    if (hasZTP) {
      setSelectedDisposition('supervisor-review')
    } else if (score >= 85 && missingCriteria.length === 0) {
      setSelectedDisposition('qualified-transfer')
    } else if (score >= 50) {
      setSelectedDisposition('warm-lead')
    } else {
      setSelectedDisposition('informational')
    }
  }, [score, missingCriteria, aiSuggestedDisposition])

  const disposition = DISPOSITIONS[selectedDisposition]

  return (
    <Card className="p-0 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-navy-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-bold text-navy-900">Call Notes & Disposition</h3>
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
        <div className="divide-y divide-navy-100">
          {/* Caller Info Summary */}
          <div className="p-4 bg-navy-50/50">
            <h4 className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-3">Caller Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {currentState.callerName && (
                <div>
                  <span className="text-navy-500">Name:</span>
                  <span className="ml-1 font-medium text-navy-900">{currentState.callerName}</span>
                </div>
              )}
              {currentState.callerPhone && (
                <div>
                  <span className="text-navy-500">Phone:</span>
                  <span className="ml-1 font-medium text-navy-900">{currentState.callerPhone}</span>
                </div>
              )}
              {currentState.state && (
                <div>
                  <span className="text-navy-500">State:</span>
                  <span className="ml-1 font-medium text-navy-900">{currentState.state}</span>
                </div>
              )}
              {currentState.insurance && (
                <div>
                  <span className="text-navy-500">Insurance:</span>
                  <span className="ml-1 font-medium text-navy-900">{currentState.insurance}</span>
                </div>
              )}
              {currentState.substance && (
                <div>
                  <span className="text-navy-500">Substance:</span>
                  <span className="ml-1 font-medium text-navy-900">{currentState.substance}</span>
                </div>
              )}
              {currentState.sobrietyTime && (
                <div>
                  <span className="text-navy-500">Last Use:</span>
                  <span className="ml-1 font-medium text-navy-900">{currentState.sobrietyTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Disposition */}
          <div className="p-4">
            <h4 className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-3">Recommended Disposition</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DISPOSITIONS).map(([key, { label, color, description }]) => (
                <button
                  key={key}
                  onClick={() => setSelectedDisposition(key)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                    selectedDisposition === key
                      ? color
                      : 'bg-navy-50 text-navy-600 border-navy-200 hover:bg-navy-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {disposition && (
              <p className="text-sm text-navy-600 mt-2">{disposition.description}</p>
            )}
          </div>

          {/* Notes */}
          <div className="p-4">
            <h4 className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-3">Agent Notes</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this call..."
              className="w-full h-24 px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Quick Actions */}
          <div className="p-4">
            <h4 className="text-xs font-semibold text-navy-500 uppercase tracking-wide mb-3">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1.5 text-sm font-medium bg-navy-100 text-navy-700 rounded-lg hover:bg-navy-200 transition-colors">
                Copy Notes
              </button>
              <button className="px-3 py-1.5 text-sm font-medium bg-navy-100 text-navy-700 rounded-lg hover:bg-navy-200 transition-colors">
                Save to Salesforce
              </button>
              <button className="px-3 py-1.5 text-sm font-medium bg-navy-100 text-navy-700 rounded-lg hover:bg-navy-200 transition-colors">
                Schedule Callback
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
