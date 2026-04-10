'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Call } from '@/lib/ctm'
import Card from '@/components/ui/Card'
import { extractGroup } from '@/lib/monitor/helpers'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
  PhoneIcon,
  ClockIcon,
  UserIcon,
  ArrowUpRightIcon,
  StarIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/utils/formatters'

export interface CallTableProps {
  calls: Call[]
  onCallClick?: (callId: string) => void
  pageSize?: number
  showPagination?: boolean
}

type SortField = 'timestamp' | 'phone' | 'agent' | 'direction' | 'duration' | 'score' | 'status'
type SortDirection = 'asc' | 'desc'

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

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

function formatDateFull(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface ScoreBadgeProps {
  score?: number
  starRating?: number
  size?: 'sm' | 'md'
}

function ScoreBadge({ score, starRating, size = 'sm' }: ScoreBadgeProps) {
  const baseClasses = 'inline-flex items-center gap-1.5 rounded-full font-semibold'
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  if (score === undefined || score === null) {
    return (
      <span className={cn(baseClasses, sizeClasses, 'bg-navy-100 text-navy-500')}>
        Pending
      </span>
    )
  }

  let className = 'bg-red-50 text-red-600'
  let label = `${Math.round(score)}`

  if (score >= 85) {
    className = 'bg-green-50 text-green-700'
  } else if (score >= 70) {
    className = 'bg-emerald-50 text-emerald-600'
  } else if (score >= 50) {
    className = 'bg-amber-50 text-amber-600'
  }

  return (
    <span className={cn(baseClasses, sizeClasses, className)}>
      {label}
      {starRating && (
        <span className="flex items-center gap-0.5">
          <StarIcon className="w-3 h-3 fill-current" />
          {starRating}
        </span>
      )}
    </span>
  )
}

interface StatusBadgeProps {
  status: string
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Completed
      </span>
    )
  }
  if (status === 'missed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Missed
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      Active
    </span>
  )
}

interface DirectionBadgeProps {
  direction: 'inbound' | 'outbound'
}

function DirectionBadge({ direction }: DirectionBadgeProps) {
  const isInbound = direction === 'inbound'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium',
        isInbound ? 'text-green-600' : 'text-navy-600'
      )}
    >
      {isInbound ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )}
      {isInbound ? 'Inbound' : 'Outbound'}
    </span>
  )
}

interface ColumnHeaderProps {
  label: string
  field: SortField
  currentSort: SortField
  direction: SortDirection
  icon?: React.ReactNode
  className?: string
  onClick: () => void
}

function ColumnHeader({ label, field, currentSort, direction, icon, className, onClick }: ColumnHeaderProps) {
  const isActive = currentSort === field

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:text-navy-900',
        isActive ? 'text-navy-900' : 'text-navy-500',
        className
      )}
    >
      {icon}
      {label}
      {isActive ? (
        direction === 'asc' ? (
          <ChevronUpIcon className="w-3.5 h-3.5" />
        ) : (
          <ChevronDownIcon className="w-3.5 h-3.5" />
        )
      ) : (
        <ChevronsUpDownIcon className="w-3.5 h-3.5 opacity-50" />
      )}
    </button>
  )
}

export default function CallTable({ calls, onCallClick, pageSize = 25, showPagination = true }: CallTableProps) {
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [localPageSize, setLocalPageSize] = useState(pageSize)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
    setCurrentPage(1)
  }

  const sortedCalls = useMemo(() => {
    return [...calls].sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortField) {
        case 'timestamp':
          aVal = new Date(a.timestamp).getTime()
          bVal = new Date(b.timestamp).getTime()
          break
        case 'phone':
          aVal = a.phone || ''
          bVal = b.phone || ''
          break
        case 'agent':
          aVal = a.agent?.name || ''
          bVal = b.agent?.name || ''
          break
        case 'direction':
          aVal = a.direction
          bVal = b.direction
          break
        case 'duration':
          aVal = a.duration
          bVal = b.duration
          break
        case 'score':
          aVal = a.analysis?.score ?? a.score ?? 0
          bVal = b.analysis?.score ?? b.score ?? 0
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [calls, sortField, sortDirection])

  const totalPages = Math.ceil(sortedCalls.length / localPageSize)
  const paginatedCalls = showPagination
    ? sortedCalls.slice((currentPage - 1) * localPageSize, currentPage * localPageSize)
    : sortedCalls

  const startItem = (currentPage - 1) * localPageSize + 1
  const endItem = Math.min(currentPage * localPageSize, sortedCalls.length)

  if (calls.length === 0) {
    return (
      <Card className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-navy-100 mb-4">
          <PhoneIcon className="w-8 h-8 text-navy-400" />
        </div>
        <h3 className="text-lg font-semibold text-navy-700 mb-1">No calls found</h3>
        <p className="text-navy-500 text-sm">Calls will appear here once detected</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card hoverable={false} className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-navy-50 to-slate-50 border-b border-navy-200 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3.5">
                  <ColumnHeader
                    label="Time"
                    field="timestamp"
                    currentSort={sortField}
                    direction={sortDirection}
                    onClick={() => handleSort('timestamp')}
                  />
                </th>
                <th className="text-left px-4 py-3.5">
                  <ColumnHeader
                    label="Phone"
                    field="phone"
                    currentSort={sortField}
                    direction={sortDirection}
                    onClick={() => handleSort('phone')}
                  />
                </th>
                <th className="text-left px-4 py-3.5 hidden lg:table-cell">
                  <ColumnHeader
                    label="Agent"
                    field="agent"
                    currentSort={sortField}
                    direction={sortDirection}
                    onClick={() => handleSort('agent')}
                    icon={<UserIcon className="w-3.5 h-3.5" />}
                  />
                </th>
                <th className="text-left px-4 py-3.5 hidden md:table-cell">
                  <ColumnHeader
                    label="Direction"
                    field="direction"
                    currentSort={sortField}
                    direction={sortDirection}
                    onClick={() => handleSort('direction')}
                  />
                </th>
                <th className="text-left px-4 py-3.5 hidden sm:table-cell">
                  <ColumnHeader
                    label="Duration"
                    field="duration"
                    currentSort={sortField}
                    direction={sortDirection}
                    onClick={() => handleSort('duration')}
                    icon={<ClockIcon className="w-3.5 h-3.5" />}
                  />
                </th>
                <th className="text-left px-4 py-3.5">
                  <ColumnHeader
                    label="Score"
                    field="score"
                    currentSort={sortField}
                    direction={sortDirection}
                    onClick={() => handleSort('score')}
                    icon={<StarIcon className="w-3.5 h-3.5" />}
                  />
                </th>
                <th className="text-left px-4 py-3.5 hidden xl:table-cell">
                  <ColumnHeader
                    label="Status"
                    field="status"
                    currentSort={sortField}
                    direction={sortDirection}
                    onClick={() => handleSort('status')}
                  />
                </th>
                <th className="text-right px-4 py-3.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-navy-400">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {paginatedCalls.map((call, index) => {
                const score = call.analysis?.score ?? call.score
                const starRating = call.starRating
                const agent = call.agent
                const hasRealAgent = agent && agent.id && agent.name && agent.id !== ''
                const agentName = hasRealAgent ? agent.name : null
                const group = agentName ? extractGroup(agentName, call.source) : null
                const displayName = agentName ? agentName.split(' - ')[0] : null

                return (
                  <tr
                    key={`${call.id}-${index}`}
                    className={cn(
                      'transition-all duration-150 hover:bg-navy-50/80 cursor-pointer group',
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-25'
                    )}
                    onClick={() => onCallClick?.(call.id)}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-navy-700 group-hover:text-navy-900">
                          {formatTime(call.timestamp)}
                        </span>
                        <span className="text-xs text-navy-400 lg:hidden">
                          {formatDateFull(call.timestamp)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/dashboard/calls/${call.id}`}
                        className="text-sm font-semibold text-navy-900 hover:text-navy-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {call.phone}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex flex-col">
                        {group && (
                          <span className="text-xs text-navy-400">{group}</span>
                        )}
                        {displayName ? (
                          <span className="text-sm text-navy-700 font-medium">{displayName}</span>
                        ) : (
                          <span className="text-sm text-navy-500 italic">
                            {call.source || 'No agent'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <DirectionBadge direction={call.direction} />
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-sm text-navy-700 font-mono">
                        {formatDuration(call.duration)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <ScoreBadge score={score} starRating={starRating} />
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <StatusBadge status={call.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/dashboard/calls/${call.id}`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-navy-100 text-navy-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-navy-200 hover:text-navy-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ArrowUpRightIcon className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {showPagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-4 text-sm text-navy-600">
            <span>
              Showing <span className="font-medium">{startItem}-{endItem}</span> of{' '}
              <span className="font-medium">{sortedCalls.length}</span> calls
            </span>
            <select
              value={localPageSize}
              onChange={(e) => {
                setLocalPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 border border-navy-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-navy-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-navy-50"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-navy-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-navy-50"
            >
              Prev
            </button>

            <div className="flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      'w-9 h-9 text-sm rounded-lg border',
                      currentPage === pageNum
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'border-navy-200 hover:bg-navy-50'
                    )}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-navy-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-navy-50"
            >
              Next
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-navy-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-navy-50"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
