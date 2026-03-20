import React from 'react'
import CallTable from '@/components/CallTable'
import { Call } from '@/lib/ctm'
import { TimeRange, formatDateRange } from '@/hooks/dashboard/useDashboard'

interface DashboardRecentCallsProps {
  calls: Call[]
  isAdmin: boolean
  assignedLabel: string | null
  userGroups: { id: string; name: string }[]
  selectedGroup: string
  allAgents: { id: string; name: string }[]
  selectedAgent: string
  timeRange: TimeRange
}

export default function DashboardRecentCalls({
  calls,
  isAdmin,
  assignedLabel,
  userGroups,
  selectedGroup,
  allAgents,
  selectedAgent,
  timeRange,
}: DashboardRecentCallsProps) {
  return (
    <div>
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-navy-900">Recent Calls</h2>
          <div className="flex gap-2 text-sm text-navy-500">
            {!isAdmin && assignedLabel && (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-medium">
                {assignedLabel}
              </span>
            )}
            {isAdmin && selectedGroup !== 'all' && (
              <span className="px-2 py-1 bg-navy-100 rounded">
                Group: {userGroups.find(g => g.id === selectedGroup)?.name}
              </span>
            )}
            {isAdmin && selectedAgent !== 'all' && (
              <span className="px-2 py-1 bg-navy-100 rounded">
                Agent: {allAgents.find(a => a.id === selectedAgent)?.name}
              </span>
            )}
            <span className="px-2 py-1 bg-navy-100 rounded">
              {formatDateRange(timeRange)}
            </span>
          </div>
        </div>
        <p className="text-navy-500 text-sm mt-1">{calls.length} calls found</p>
      </div>
      <CallTable calls={calls} />
    </div>
  )
}