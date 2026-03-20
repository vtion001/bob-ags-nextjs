import { useState, useEffect, useCallback, useRef } from 'react'
import { Call } from '@/lib/ctm'

export interface Agent {
  id: string
  uid: number
  name: string
  email: string
}

export interface UserGroup {
  id: string
  name: string
  userIds: number[]
}

export interface DashboardStats {
  totalCalls: number
  analyzed: number
  hotLeads: number
  avgScore: string
}

export interface LiveCallsMeta {
  total: number
  isAdmin: boolean
  assignedGroupId: string | null
  assignedAgentId: string | null
  userEmail: string
}

export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'custom'

interface UseDashboardReturn {
  isLoading: boolean
  isRefreshing: boolean
  isAnalyzing: boolean
  analyzeProgress: string
  autoRefresh: boolean
  userGroups: UserGroup[]
  allAgents: Agent[]
  selectedGroup: string
  setSelectedGroup: (id: string) => void
  selectedAgent: string
  setSelectedAgent: (id: string) => void
  selectedAgentUid: number | null
  timeRange: TimeRange
  setTimeRange: (r: TimeRange) => void
  customStartDate: string
  setCustomStartDate: (d: string) => void
  customEndDate: string
  setCustomEndDate: (d: string) => void
  stats: DashboardStats
  recentCalls: Call[]
  error: string | null
  liveMeta: LiveCallsMeta | null
  userEmail: string | null
  handleGroupChange: (groupId: string) => void
  handleAgentChange: (agentId: string) => void
  handleSyncNow: () => Promise<void>
  toggleAutoRefresh: () => void
  handleAnalyze: () => Promise<void>
  getAvailableAgents: () => Agent[]
}

export function getHoursFromRange(range: TimeRange): number {
  switch (range) {
    case '24h': return 24
    case '7d': return 168
    case '30d': return 720
    case '90d': return 2160
    default: return 168
  }
}

export function formatDateRange(range: TimeRange): string {
  switch (range) {
    case '24h': return 'Last 24 Hours'
    case '7d': return 'Last 7 Days'
    case '30d': return 'Last 30 Days'
    case '90d': return 'Last 90 Days'
    case 'custom': return 'Custom Range'
  }
}

export function useDashboard(): UseDashboardReturn {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [allAgents, setAllAgents] = useState<Agent[]>([])
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [selectedAgent, setSelectedAgent] = useState('all')
  const [selectedAgentUid, setSelectedAgentUid] = useState<number | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    analyzed: 0,
    hotLeads: 0,
    avgScore: '0',
  })
  const [recentCalls, setRecentCalls] = useState<Call[]>([])
  const [error, setError] = useState<string | null>(null)
  const [liveMeta, setLiveMeta] = useState<LiveCallsMeta | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const pendingOverrideRef = useRef<{ groupId?: string; agentUid?: number } | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session')
        if (!sessionRes.ok) {
          window.location.href = '/'
          return
        }
        const sessionData = await sessionRes.json()
        setUserEmail(sessionData.email)

        const [permsRes, agentsRes] = await Promise.all([
          fetch('/api/users/permissions'),
          fetch('/api/ctm/agents'),
        ])

        let isAdmin = false
        let assignedGroupId: string | null = null
        let assignedAgentId: string | null = null

        if (permsRes.ok) {
          const permsData = await permsRes.json()
          isAdmin = permsData.role === 'admin'
        }

        if (agentsRes.ok) {
          const agentsData = await agentsRes.json()
          setAllAgents(agentsData.agents || [])
          setUserGroups(agentsData.userGroups || [])
        }

        if (!isAdmin) {
          const settingsRes = await fetch('/api/users/settings')
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json()
            const settings = settingsData.settings || {}
            assignedGroupId = settings.ctm_user_group_id || null
            assignedAgentId = settings.ctm_agent_id || null

            if (assignedAgentId) {
              setSelectedAgent(assignedAgentId)
              setSelectedAgentUid(Number(assignedAgentId))
              setSelectedGroup('all')
            } else if (assignedGroupId) {
              setSelectedGroup(String(assignedGroupId))
              setSelectedAgent('all')
              setSelectedAgentUid(null)
            }
          }
        }

        setLiveMeta({
          total: 0,
          isAdmin,
          assignedGroupId,
          assignedAgentId,
          userEmail: sessionData.email,
        })
      } catch {
        window.location.href = '/'
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  const fetchCTMCalls = useCallback(async (manualOverride?: { groupId?: string; agentUid?: number }) => {
    try {
      const hours = timeRange === 'custom' && customStartDate && customEndDate
        ? Math.max(1, Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60)))
        : getHoursFromRange(timeRange)

      const params = new URLSearchParams({
        hours: String(Math.min(hours, 2160)),
        status: 'completed',
      })

      if (manualOverride?.groupId && manualOverride.groupId !== 'all') {
        params.set('groupId', manualOverride.groupId)
      }
      if (manualOverride?.agentUid) {
        params.set('agentId', String(manualOverride.agentUid))
      }

      const res = await fetch(`/api/ctm/live-calls?${params}`)
      if (!res.ok) throw new Error('Failed to fetch calls')

      const data = await res.json()
      const meta = data.meta || {}
      setLiveMeta(prev => ({ ...(prev || {}), ...meta }) as LiveCallsMeta)

      let calls: Call[] = data.calls || []

      if (meta.isAdmin) {
        if (selectedGroup !== 'all') {
          const group = userGroups.find(g => g.id === selectedGroup)
          if (group) {
            calls = calls.filter(call => {
              const aid = (call.agent as any)?.id || call.agent?.id
              if (!aid) return false
              const agentUid = Number(aid)
              const agent = allAgents.find(a =>
                a.id === String(aid) || a.uid === agentUid
              )
              if (!agent || agent.uid === undefined) return false
              return group.userIds.includes(agent.uid)
            })
          }
        }

        if (selectedAgentUid !== null) {
          calls = calls.filter(call => {
            const aid = (call.agent as any)?.id || call.agent?.id
            return String(aid) === String(selectedAgentUid) || aid === selectedAgentUid
          })
        }
      }

      calls = calls.filter(c => c.direction === 'inbound')

      const inboundTotal = calls.length
      const analyzedCount = calls.filter((c: Call) => c.score || c.analysis).length
      const hotLeadsCount = calls.filter((c: Call) => c.analysis?.sentiment === 'positive' || (c.score && c.score >= 80)).length
      const scoredCalls = calls.filter((c: Call) => c.score && c.score > 0)
      const avgScore = scoredCalls.length > 0
        ? Math.round(scoredCalls.reduce((sum: number, c: Call) => sum + (c.score || 0), 0) / scoredCalls.length)
        : 0

      setStats({
        totalCalls: inboundTotal,
        analyzed: analyzedCount,
        hotLeads: hotLeadsCount,
        avgScore: avgScore.toString(),
      })
      setRecentCalls(calls.slice(0, 50))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calls')
    }
  }, [timeRange, customStartDate, customEndDate, selectedGroup, selectedAgentUid, userGroups, allAgents])

  useEffect(() => {
    if (!isLoading && userEmail) {
      fetchCTMCalls()
    }
  }, [isLoading, userEmail, fetchCTMCalls])

  useEffect(() => {
    if (!isLoading && userEmail) {
      const override = pendingOverrideRef.current
      pendingOverrideRef.current = null
      fetchCTMCalls(override || undefined)
    }
  }, [timeRange, customStartDate, customEndDate, selectedAgentUid, selectedGroup, isLoading, userEmail, fetchCTMCalls])

  useEffect(() => {
    if (!autoRefresh || isLoading) return
    const interval = setInterval(() => {
      fetchCTMCalls()
    }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, isLoading, fetchCTMCalls])

  const handleGroupChange = useCallback((groupId: string) => {
    setSelectedGroup(groupId)
    setSelectedAgent('all')
    setSelectedAgentUid(null)
    pendingOverrideRef.current = { groupId }
    fetchCTMCalls({ groupId })
  }, [fetchCTMCalls])

  const handleAgentChange = useCallback((agentId: string) => {
    setSelectedAgent(agentId)
    const agent = allAgents.find(a => a.id === agentId)
    setSelectedAgentUid(agent?.uid || null)
    if (agent?.uid) {
      setSelectedGroup('all')
    }
    pendingOverrideRef.current = agent?.uid ? { agentUid: agent.uid } : null
    fetchCTMCalls({ agentUid: agent?.uid || undefined })
  }, [allAgents, fetchCTMCalls])

  const handleSyncNow = useCallback(async () => {
    setIsRefreshing(true)
    pendingOverrideRef.current = null
    try {
      await fetchCTMCalls()
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchCTMCalls])

  const toggleAutoRefresh = useCallback(() => setAutoRefresh(!autoRefresh), [autoRefresh])

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true)
    setAnalyzeProgress('Analyzing calls...')
    try {
      const analyzeRes = await fetch('/api/ctm/calls/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callIds: recentCalls.map((c: Call) => c.id).filter(Boolean) }),
      })
      if (analyzeRes.ok) {
        const result = await analyzeRes.json()
        setAnalyzeProgress(`Analyzed ${result.analyzed} calls!`)
        await fetchCTMCalls()
        setTimeout(() => setAnalyzeProgress(''), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }, [recentCalls, fetchCTMCalls])

  const getAvailableAgents = useCallback((): Agent[] => {
    if (selectedGroup === 'all') return allAgents
    const group = userGroups.find(g => g.id === selectedGroup)
    if (!group) return []
    return allAgents.filter(agent => group.userIds.includes(agent.uid))
  }, [selectedGroup, allAgents, userGroups])

  return {
    isLoading,
    isRefreshing,
    isAnalyzing,
    analyzeProgress,
    autoRefresh,
    userGroups,
    allAgents,
    selectedGroup,
    setSelectedGroup: handleGroupChange,
    selectedAgent,
    setSelectedAgent: handleAgentChange,
    selectedAgentUid,
    timeRange,
    setTimeRange,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    stats,
    recentCalls,
    error,
    liveMeta,
    userEmail,
    handleGroupChange,
    handleAgentChange,
    handleSyncNow,
    toggleAutoRefresh,
    handleAnalyze,
    getAvailableAgents,
  }
}