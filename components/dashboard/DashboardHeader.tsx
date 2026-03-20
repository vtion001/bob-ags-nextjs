import React from 'react'
import Select from '@/components/ui/select'
import Button from '@/components/ui/Button'
import { Agent, UserGroup, TimeRange } from '@/hooks/dashboard/useDashboard'

interface DashboardHeaderProps {
  timeRange: TimeRange
  onTimeRangeChange: (r: TimeRange) => void
  isAdmin: boolean
  userGroups: UserGroup[]
  selectedGroup: string
  onGroupChange: (id: string) => void
  selectedAgent: string
  onAgentChange: (id: string) => void
  allAgents: Agent[]
  getAvailableAgents: () => Agent[]
  onSyncNow: () => void
  isRefreshing: boolean
  autoRefresh: boolean
  onToggleAutoRefresh: () => void
  onAnalyze: () => void
  isAnalyzing: boolean
}

export default function DashboardHeader({
  timeRange,
  onTimeRangeChange,
  isAdmin,
  userGroups,
  selectedGroup,
  onGroupChange,
  selectedAgent,
  onAgentChange,
  allAgents,
  getAvailableAgents,
  onSyncNow,
  isRefreshing,
  autoRefresh,
  onToggleAutoRefresh,
  onAnalyze,
  isAnalyzing,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Dashboard</h1>
        <p className="text-navy-500">
          {isAdmin ? 'All calls across your account' : 'Your assigned calls'}
        </p>
      </div>
      <div className="flex gap-3 items-center flex-wrap">
        <Select
          value={timeRange}
          onChange={(v) => onTimeRangeChange(v as TimeRange)}
          options={[
            { value: '24h', label: 'Last 24 Hours' },
            { value: '7d', label: 'Last 7 Days' },
            { value: '30d', label: 'Last 30 Days' },
            { value: '90d', label: 'Last 90 Days' },
          ]}
          className="w-40"
        />

        {isAdmin && userGroups.length > 0 && (
          <Select
            value={selectedGroup}
            onChange={onGroupChange}
            options={[
              { value: 'all', label: 'All Groups' },
              ...userGroups.map((g) => ({ value: g.id, label: g.name })),
            ]}
            className="w-40"
          />
        )}

        {isAdmin && (
          <Select
            value={selectedAgent}
            onChange={onAgentChange}
            options={[
              { value: 'all', label: 'All Agents' },
              ...getAvailableAgents().map((a) => ({ value: a.id, label: a.name })),
            ]}
            className="w-40"
          />
        )}

        <Button variant="secondary" size="md" onClick={onSyncNow} isLoading={isRefreshing}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Sync Now
        </Button>

        <button
          onClick={onToggleAutoRefresh}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            autoRefresh ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          <svg className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {autoRefresh ? 'Auto' : 'Paused'}
        </button>

        <Button variant="primary" size="md" onClick={onAnalyze} isLoading={isAnalyzing}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Run Analysis
        </Button>
      </div>
    </div>
  )
}