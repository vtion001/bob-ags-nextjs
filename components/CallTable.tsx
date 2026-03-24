'use client'

import React from 'react'
import Link from 'next/link'
import { Call } from '@/lib/ctm'
import Card from './ui/Card'
import { extractGroup } from '@/lib/monitor/helpers'

export interface CallTableProps {
  calls: Call[]
  onCallClick?: (callId: string) => void
}

function formatTime(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function getScoreBadge(score?: number) {
  if (!score) return { label: 'Pending', className: 'bg-navy-100 text-navy-600' }
  if (score >= 75) return { label: 'Hot', className: 'bg-navy-900 text-white' }
  if (score >= 50) return { label: 'Warm', className: 'bg-navy-100 text-navy-800' }
  return { label: 'Cold', className: 'bg-red-50 text-red-600' }
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') {
    return (
      <span className="flex items-center gap-1.5 text-green-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Done
      </span>
    )
  }
  if (status === 'missed') {
    return (
      <span className="flex items-center gap-1.5 text-red-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Missed
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-navy-500">
      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Active
    </span>
  )
}

export default function CallTable({ calls, onCallClick }: CallTableProps) {
  if (calls.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-navy-100 mb-3">
          <svg className="w-6 h-6 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <p className="text-navy-600 font-medium">No calls yet</p>
        <p className="text-navy-400 text-sm mt-1">Calls will appear here once detected</p>
      </Card>
    )
  }

  return (
    <Card hoverable={false} className="overflow-x-auto p-0">
      <table className="w-full">
        <thead className="bg-navy-50 border-b border-navy-200">
          <tr>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-navy-500 uppercase tracking-wider">Time</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-navy-500 uppercase tracking-wider">Phone</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-navy-500 uppercase tracking-wider">Group / Agent</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-navy-500 uppercase tracking-wider">Direction</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-navy-500 uppercase tracking-wider">Duration</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-navy-500 uppercase tracking-wider">Score</th>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-100">
          {calls.map((call, index) => {
            const score = call.analysis?.score ?? call.score
            const badge = getScoreBadge(score)
            const agent = call.agent
            const hasRealAgent = agent && agent.id && agent.name && agent.id !== ''
            const agentName = hasRealAgent ? agent.name : null
            const group = agentName ? extractGroup(agentName, call.source) : null
            const displayName = agentName ? agentName.split(' - ')[0] : null
            return (
              <tr
                key={`${call.id}-${index}`}
                className={`transition-colors duration-150 hover:bg-navy-50 cursor-pointer ${
                  index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
                onClick={() => onCallClick?.(call.id)}
              >
                <td className="px-5 py-4">
                  <Link href={`/dashboard/calls/${call.id}`} className="text-sm text-navy-700 hover:text-navy-900">
                    {formatTime(call.timestamp)}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <Link href={`/dashboard/calls/${call.id}`} className="text-sm font-semibold text-navy-900 hover:text-navy-700">
                    {call.phone}
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col">
                    {group && (
                      <span className="text-xs text-navy-400">{group}</span>
                    )}
                    {displayName && (
                      <span className="text-sm text-navy-700 font-medium">{displayName}</span>
                    )}
                    {!displayName && (
                      <span className="text-sm text-navy-500 italic">
                        {call.source || 'No agent'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                    call.direction === 'inbound' ? 'text-green-600' : 'text-navy-600'
                  }`}>
                    {call.direction === 'inbound' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    )}
                    {call.direction === 'inbound' ? 'Inbound' : 'Outbound'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm text-navy-700 font-medium">
                    {formatDuration(call.duration)}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badge.className}`}>
                    {score !== undefined && score !== null ? Math.round(score) : badge.label}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <StatusIcon status={call.status} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Card>
  )
}
