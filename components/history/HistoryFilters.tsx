import React, { useState, useRef, useEffect } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
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
  isSyncing?: boolean
}

function GroupAgentCascade({
  userGroups,
  agentProfiles,
  groupFilter,
  agentIdFilter,
  onGroupChange,
  onAgentChange,
}: {
  userGroups: UserGroup[]
  agentProfiles: AgentProfile[]
  groupFilter: string
  agentIdFilter: string
  onGroupChange: (id: string) => void
  onAgentChange: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)

  const getAgentsInGroup = (group: UserGroup) => {
    return agentProfiles.filter(agent => {
      const uid = Number(agent.agent_id)
      return group.userIds.includes(uid)
    })
  }

  const getButtonLabel = () => {
    if (agentIdFilter && agentIdFilter !== '') {
      const agent = agentProfiles.find(a => a.agent_id === agentIdFilter)
      return agent ? agent.name : 'All Agents'
    }
    if (groupFilter && groupFilter !== '') {
      const group = userGroups.find(g => g.id === groupFilter)
      if (group) {
        return `${group.name} (${getAgentsInGroup(group).length})`
      }
    }
    return 'All Agents'
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-navy-700 mb-2">Group / Agent</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full px-3 py-2 rounded-lg border bg-white text-left
          flex items-center justify-between gap-2
          transition-all duration-200
          focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20
          border-navy-200 text-navy-900 hover:border-navy-400
        "
      >
        <span className="text-navy-900">{getButtonLabel()}</span>
        <ChevronDownIcon
          className="w-4 h-4 text-navy-400 transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl border border-navy-200 shadow-xl overflow-hidden">
          <div className="max-h-80 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                onGroupChange('')
                onAgentChange('')
                setIsOpen(false)
              }}
              className={`
                w-full px-4 py-2.5 text-left flex items-center justify-between
                transition-colors duration-150 hover:bg-navy-50 cursor-pointer
                ${groupFilter === '' && agentIdFilter === '' ? 'bg-navy-100' : ''}
              `}
            >
              <span className="font-medium text-navy-700">All Agents</span>
              <span className="text-xs text-navy-400">{agentProfiles.length}</span>
            </button>

            <div className="border-t border-navy-100 my-1" />

            {userGroups.map(group => {
              const agentsInGroup = getAgentsInGroup(group)
              return (
                <div key={group.id}>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={`
                        flex-1 px-4 py-2.5 text-left flex items-center justify-between
                        transition-colors duration-150 hover:bg-navy-50 cursor-pointer
                        ${groupFilter === group.id && agentIdFilter === '' ? 'bg-navy-100' : ''}
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRightIcon
                          className={`w-4 h-4 text-navy-400 transition-transform duration-200 ${
                            expandedGroups.has(group.id) ? 'rotate-90' : ''
                          }`}
                        />
                        <span className="font-medium text-navy-700">{group.name}</span>
                      </div>
                      <span className="text-xs text-navy-400">{agentsInGroup.length}</span>
                    </button>
                  </div>

                  {expandedGroups.has(group.id) && (
                    <div className="bg-navy-50/50">
                      <button
                        type="button"
                        onClick={() => {
                          onGroupChange(group.id)
                          onAgentChange('')
                          setIsOpen(false)
                        }}
                        className={`
                          w-full px-4 py-2 pl-10 text-left flex items-center justify-between
                          transition-colors duration-150 hover:bg-navy-100 cursor-pointer
                          ${groupFilter === group.id && agentIdFilter === '' ? 'bg-navy-200' : ''}
                        `}
                      >
                        <span className="text-navy-600">All in {group.name}</span>
                        <span className="text-xs text-navy-400">{agentsInGroup.length}</span>
                      </button>
                      {agentsInGroup.map(agent => (
                        <button
                          key={agent.agent_id}
                          type="button"
                          onClick={() => {
                            onAgentChange(agent.agent_id)
                            onGroupChange(group.id)
                            setIsOpen(false)
                          }}
                          className={`
                            w-full px-4 py-2 pl-10 text-left flex items-center justify-between
                            transition-colors duration-150 hover:bg-navy-100 cursor-pointer
                            ${agentIdFilter === agent.agent_id ? 'bg-navy-200' : ''}
                          `}
                        >
                          <span className="text-navy-600">{agent.name}</span>
                          {agentIdFilter === agent.agent_id && (
                            <svg className="w-4 h-4 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {userGroups.length === 0 && (
              <div className="px-4 py-6 text-center text-navy-400">
                No groups available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
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
  isSyncing,
}: HistoryFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 mb-4">
        <Input
          label="Phone Number"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter by phone..."
        />

        <GroupAgentCascade
          userGroups={userGroups}
          agentProfiles={agentProfiles}
          groupFilter={groupFilter}
          agentIdFilter={agentIdFilter}
          onGroupChange={onGroupFilterChange}
          onAgentChange={onAgentIdChange}
        />

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

      {isSyncing && (
        <div className="flex items-center gap-2 text-sm text-navy-500">
          <div className="w-4 h-4 border-2 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
          Syncing latest calls...
        </div>
      )}
    </div>
  )
}