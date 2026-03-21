import { useState, useEffect, useRef, useCallback } from 'react'
import { Call } from '@/lib/ctm'

interface AgentProfile {
  id: string
  name: string
  agent_id: string
  email?: string
  groupId?: string
  groupName?: string
}

interface UserGroup {
  id: string
  name: string
  userIds: number[]
}

interface UseCallHistoryOptions {
  agentIdFilter?: string
}

interface UseCallHistoryReturn {
  calls: Call[]
  filteredCalls: Call[]
  agentProfiles: AgentProfile[]
  userGroups: UserGroup[]
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  searchQuery: string
  setSearchQuery: (q: string) => void
  agentIdFilter: string
  setAgentIdFilter: (id: string) => void
  groupFilter: string
  setGroupFilter: (id: string) => void
  analyzedOnly: boolean
  setAnalyzedOnly: (v: boolean) => void
  dateRange: { start: string; end: string }
  setDateRange: (r: { start: string; end: string }) => void
  scoreFilter: { min: number; max: number }
  setScoreFilter: (f: { min: number; max: number }) => void
  handleRefresh: () => void
  handleExport: () => void
}

function dedupeCalls(calls: Call[]): Call[] {
  const seen = new Set<string>()
  return calls.filter(call => {
    if (seen.has(call.id)) return false
    seen.add(call.id)
    return true
  })
}

export function useCallHistory(options: UseCallHistoryOptions = {}): UseCallHistoryReturn {
  const [searchQuery, setSearchQuery] = useState('')
  const [agentIdFilter, setAgentIdFilter] = useState(options.agentIdFilter || '')
  const [agentProfiles, setAgentProfiles] = useState<AgentProfile[]>([])
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [groupFilter, setGroupFilter] = useState('')
  const [analyzedOnly, setAnalyzedOnly] = useState(false)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [scoreFilter, setScoreFilter] = useState({ min: 0, max: 100 })
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([])
  const [allCalls, setAllCalls] = useState<Call[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lastSeenTimestamp = useRef<string | null>(null)

  useEffect(() => {
    const fetchAgentsAndGroups = async () => {
      try {
        const res = await fetch('/api/ctm/agents')
        if (res.ok) {
          const data = await res.json()
          if (data.agents) {
            const mappedAgents = data.agents.map((agent: any) => ({
              id: agent.id || agent.uid?.toString() || '',
              name: agent.name || 'Unknown',
              agent_id: agent.uid?.toString() || agent.id || '',
              email: agent.email || '',
            }))
            setAgentProfiles(mappedAgents)
          }
          if (data.userGroups) {
            setUserGroups(data.userGroups)
          }
        }
      } catch (err) {
        console.error('Failed to fetch agents/groups:', err)
      }
    }
    fetchAgentsAndGroups()
  }, [])

  const mergeNewCalls = useCallback((incoming: Call[]) => {
    setAllCalls(prev => {
      const existingIds = new Set(prev.map(c => c.id))
      const trulyNew = incoming.filter(c => !existingIds.has(c.id))
      if (trulyNew.length === 0) return prev
      const merged = dedupeCalls([...trulyNew, ...prev])
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      return merged
    })
  }, [])

  const fetchFromCTM = useCallback(async (mode: 'initial' | 'poll' | 'refresh' = 'poll') => {
    if (mode === 'refresh') setIsRefreshing(true)
    else if (mode === 'initial') setIsLoading(true)
    setError(null)

    try {
      let url = mode === 'initial'
        ? `/api/calls?limit=200&hours=1`
        : `/api/calls?mode=delta&limit=200`
      if (agentIdFilter) url += `&agentId=${encodeURIComponent(agentIdFilter)}`

      const res = await fetch(url)
      if (!res.ok) {
        if (res.status === 401) throw new Error('Please log in to view calls')
        throw new Error('Failed to fetch calls')
      }

      const data = await res.json()
      const incoming: Call[] = dedupeCalls(data.calls || [])

      if (mode === 'initial') {
        if (data.fromCache && incoming.length > 0) {
          setAllCalls(incoming)
          const pollRes = await fetch(`/api/calls?mode=delta&limit=200${agentIdFilter ? `&agentId=${encodeURIComponent(agentIdFilter)}` : ''}`)
          if (pollRes.ok) {
            const pollData = await pollRes.json()
            const newCalls: Call[] = dedupeCalls(pollData.calls || [])
            if (newCalls.length > 0) mergeNewCalls(newCalls)
          }
        } else {
          const [deltaRes, fullRes] = await Promise.all([
            fetch(`/api/calls?mode=delta&limit=200${agentIdFilter ? `&agentId=${encodeURIComponent(agentIdFilter)}` : ''}`),
            fetch(`/api/calls?limit=200&hours=168${agentIdFilter ? `&agentId=${encodeURIComponent(agentIdFilter)}` : ''}`),
          ])
          const deltaData = deltaRes.ok ? await deltaRes.json() : null
          const fullData = fullRes.ok ? await fullRes.json() : null
          const deltaCalls: Call[] = dedupeCalls(deltaData?.calls || [])
          const fullCalls: Call[] = dedupeCalls(fullData?.calls || [])
          if (deltaCalls.length > 0) setAllCalls(deltaCalls)
          else if (fullCalls.length > 0) setAllCalls(fullCalls)
        }
      } else {
        if (incoming.length > 0) mergeNewCalls(incoming)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [agentIdFilter, mergeNewCalls])

  useEffect(() => {
    fetchFromCTM('initial')
  }, [fetchFromCTM])

  useEffect(() => {
    const interval = setInterval(() => fetchFromCTM('poll'), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchFromCTM])

  useEffect(() => {
    let results = [...allCalls]

    if (searchQuery) {
      results = results.filter(call =>
        call.phone.includes(searchQuery) ||
        call.callerNumber?.includes(searchQuery)
      )
    }

    if (analyzedOnly) {
      results = results.filter(call => call.score !== undefined && call.score !== null && call.score > 0)
    }

    if (groupFilter) {
      const group = userGroups.find(g => g.id === groupFilter)
      if (group) {
        results = results.filter(call => {
          const agent = agentProfiles.find(a => a.agent_id === call.agent?.id?.toString())
          if (!agent) return false
          return group.userIds.includes(Number(agent.agent_id))
        })
      }
    }

    if (scoreFilter.min > 0 || scoreFilter.max < 100) {
      results = results.filter(call =>
        call.score && call.score >= scoreFilter.min && call.score <= scoreFilter.max
      )
    }

    if (dateRange.start) {
      const startDate = new Date(dateRange.start)
      results = results.filter(call => new Date(call.timestamp) >= startDate)
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      results = results.filter(call => new Date(call.timestamp) <= endDate)
    }

    setFilteredCalls(results)
  }, [allCalls, searchQuery, analyzedOnly, groupFilter, scoreFilter, dateRange, userGroups, agentProfiles])

  const handleRefresh = useCallback(() => {
    fetchFromCTM('refresh')
  }, [fetchFromCTM])

  const handleExport = useCallback(() => {
    const csv = [
      ['Time', 'Phone', 'Direction', 'Duration', 'Score', 'Status'],
      ...filteredCalls.map(call => [
        new Date(call.timestamp).toISOString(),
        call.phone,
        call.direction,
        `${Math.floor(call.duration / 60)}m ${call.duration % 60}s`,
        call.score || 'N/A',
        call.status,
      ]),
    ]

    const csvContent = csv.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'call_history.csv'
    a.click()
  }, [filteredCalls])

  return {
    calls: allCalls,
    filteredCalls,
    agentProfiles,
    userGroups,
    isLoading,
    isRefreshing,
    error,
    searchQuery,
    setSearchQuery,
    agentIdFilter,
    setAgentIdFilter,
    groupFilter,
    setGroupFilter,
    analyzedOnly,
    setAnalyzedOnly,
    dateRange,
    setDateRange,
    scoreFilter,
    setScoreFilter,
    handleRefresh,
    handleExport,
  }
}