import React from 'react'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/select'
import Button from '@/components/ui/Button'
import { Call } from '@/lib/ctm'

interface AgentProfile {
  id: string
  name: string
  agent_id: string
  email?: string
}

interface UserGroup {
  id: string
  name: string
  userIds: number[]
}

interface HistoryFiltersProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  agentIdFilter: string
  onAgentIdChange: (id: string) => void
  agentProfiles: AgentProfile[]
  groupFilter: string
  onGroupFilterChange: (id: string) => void
  userGroups: UserGroup[]
  scoreFilter: { min: number; max: number }
  onScoreFilterChange: (f: { min: number; max: number }) => void
  dateRange: { start: string; end: string }
  onDateRangeChange: (r: { start: string; end: string }) => void
  analyzedOnly: boolean
  onAnalyzedOnlyChange: (v: boolean) => void
  onRefresh: () => void
  isRefreshing: boolean
}

export default function HistoryFilters({
  searchQuery,
  onSearchChange,
  agentIdFilter,
  onAgentIdChange,
  agentProfiles,
  groupFilter,
  onGroupFilterChange,
  userGroups,
  scoreFilter,
  onScoreFilterChange,
  dateRange,
  onDateRangeChange,
  analyzedOnly,
  onAnalyzedOnlyChange,
  onRefresh,
  isRefreshing,
}: HistoryFiltersProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-4">
        <Input
          label="Phone Number"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by phone..."
        />

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">Group</label>
          <Select
            value={groupFilter}
            onChange={onGroupFilterChange}
            placeholder="All Groups"
            options={[
              { value: '', label: 'All Groups' },
              ...userGroups.map((group) => ({
                value: group.id,
                label: `${group.name} (${group.userIds.length})`,
              })),
            ]}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-navy-700 mb-2">Agent</label>
          <Select
            value={agentIdFilter}
            onChange={onAgentIdChange}
            placeholder="All Agents"
            options={[
              { value: '', label: 'All Agents' },
              ...agentProfiles.map((agent) => ({
                value: agent.agent_id,
                label: `${agent.name} (${agent.agent_id})`,
              })),
            ]}
            className="w-full"
          />
        </div>

        <Input
          label="Min Score"
          type="number"
          min="0"
          max="100"
          value={scoreFilter.min}
          onChange={(e) => onScoreFilterChange({ ...scoreFilter, min: parseInt(e.target.value) || 0 })}
        />

        <Input
          label="Max Score"
          type="number"
          min="0"
          max="100"
          value={scoreFilter.max}
          onChange={(e) => onScoreFilterChange({ ...scoreFilter, max: parseInt(e.target.value) || 100 })}
        />

        <div className="flex items-end">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={onRefresh}
            isLoading={isRefreshing}
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        <Input
          label="Start Date"
          type="date"
          value={dateRange.start}
          onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
        />

        <Input
          label="End Date"
          type="date"
          value={dateRange.end}
          onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
        />

        <div className="flex items-center gap-3 h-[42px]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={analyzedOnly}
              onChange={(e) => onAnalyzedOnlyChange(e.target.checked)}
              className="w-4 h-4 rounded border-navy-300 text-navy-600 focus:ring-navy-500"
            />
            <span className="text-sm font-medium text-navy-700">Analyzed Only</span>
          </label>
        </div>
      </div>
    </div>
  )
}