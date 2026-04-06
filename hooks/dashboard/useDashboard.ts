import { useState, useEffect, useCallback, useRef } from 'react'
import { Call } from '@/lib/ctm'
import { useAuth } from '@/contexts/AuthContext'

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

export interface ScoreDistribution {
  excellent: number
  good: number
  needsImprovement: number
  poor: number
}

export interface ZTPViolations {
  hipaaRisk: number
  medicalAdviceRisk: number
  unqualifiedTransfer: number
}

export interface DispositionBreakdown {
  qualified: number
  warmLead: number
  refer: number
  doNotRefer: number
}

export interface KPIStats {
  totalCalls: number
  answered: number
  missed: number
  voicemail: number
  avgDuration: number
  avgTalkTime: number
  avgWaitTime: number
  avgRingTime: number
  avgScore: number
  scoreDistribution: ScoreDistribution
  ztpViolations: ZTPViolations
  disposition: DispositionBreakdown
}

export interface DashboardStats {
  totalCalls: number
  analyzed: number
  hotLeads: number
  avgScore: string
  kpi: KPIStats
}

export interface LiveCallsMeta {
  total: number
  isAdmin: boolean
  assignedGroupId: string | null
  assignedAgentId: string | null
  userEmail: string | null
}

export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'custom'

interface UseDashboardReturn {
  isLoading: boolean
  isRefreshing: boolean
  isSyncing: boolean
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
  const [isSyncing, setIsSyncing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
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
    kpi: {
      totalCalls: 0,
      answered: 0,
      missed: 0,
      voicemail: 0,
      avgDuration: 0,
      avgTalkTime: 0,
      avgWaitTime: 0,
      avgRingTime: 0,
      avgScore: 0,
      scoreDistribution: { excellent: 0, good: 0, needsImprovement: 0, poor: 0 },
      ztpViolations: { hipaaRisk: 0, medicalAdviceRisk: 0, unqualifiedTransfer: 0 },
      disposition: { qualified: 0, warmLead: 0, refer: 0, doNotRefer: 0 },
    },
  })
  const [recentCalls, setRecentCalls] = useState<Call[]>([])
  const [error, setError] = useState<string | null>(null)
  const [liveMeta, setLiveMeta] = useState<LiveCallsMeta | null>(null)
  const pendingOverrideRef = useRef<{ groupId?: string; agentUid?: number } | null>(null)

  const { email: userEmail, agents: allAgents, userGroups, isAdmin, isLoading: authLoading, isReady } = useAuth()

  const fetchStats = useCallback(async (options: { blocking?: boolean; manualOverride?: { groupId?: string; agentUid?: number } } = {}) => {
    const { blocking = false } = options
    if (blocking) {
      setIsRefreshing(true)
      setError(null)
    } else {
      setIsSyncing(true)
      setError(null)
    }

    try {
      const hours = timeRange === 'custom' && customStartDate && customEndDate
        ? Math.max(1, Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60)))
        : getHoursFromRange(timeRange)
      const agentParam = options.manualOverride?.agentUid
        ? `&agent_id=${options.manualOverride.agentUid}`
        : selectedAgentUid ? `&agent_id=${selectedAgentUid}` : ''

      const [cacheRes, ctmRes] = await Promise.all([
        fetch(`/api/ctm/dashboard/stats?cacheOnly=true&hours=${Math.min(hours, 2160)}${agentParam}`),
        fetch(`/api/ctm/dashboard/stats?hours=${Math.min(hours, 2160)}${agentParam}`),
      ])

      const [cacheData, ctmData] = await Promise.all([cacheRes.json(), ctmRes.json()])

      if (cacheData?.stats) {
        setStats(prev => ({
          ...prev,
          ...cacheData.stats,
          // Preserve existing kpi since CTM stats endpoint doesn't include it
          kpi: prev.kpi,
        }))
      }
      if (cacheData?.recentCalls) setRecentCalls(cacheData.recentCalls)
      if (ctmData?.stats && !ctmData.fromCache) {
        setStats(prev => ({
          ...prev,
          ...ctmData.stats,
          // Preserve existing kpi since CTM stats endpoint doesn't include it
          kpi: prev.kpi,
        }))
        setRecentCalls(ctmData.recentCalls || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      if (blocking) setIsRefreshing(false)
      else setIsSyncing(false)
    }
  }, [timeRange, customStartDate, customEndDate, selectedAgentUid])

  useEffect(() => {
    // Don't redirect prematurely on empty allAgents — it may still be loading
    // Only redirect on explicit auth failure (401) from the session endpoint
    if (!isReady || authLoading) return

    const init = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session')
        if (sessionRes.status === 401) {
          window.location.href = '/'
          return
        }

        const settingsRes = await fetch('/api/users/settings')
        let assignedGroupId: string | null = null
        let assignedAgentId: string | null = null

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

        setLiveMeta({
          total: 0,
          isAdmin,
          assignedGroupId,
          assignedAgentId,
          userEmail,
        })
      } catch (err) {
        // Only redirect on network errors, not on partial failures
        // Settings fetch failure is non-fatal - user can still use dashboard
        console.error('Dashboard init error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [isReady, authLoading, allAgents, userGroups, isAdmin, userEmail])

  useEffect(() => {
    if (isLoading) return
    fetchStats()
  }, [isLoading, fetchStats])

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

      // Calculate KPI stats from calls
      const answered = calls.filter(c => c.status === 'completed').length
      const missed = calls.filter(c => c.status === 'missed').length
      const voicemail = calls.filter(c => c.status === 'voicemail').length

      const totalDuration = calls.reduce((sum: number, c: Call) => sum + (c.duration || 0), 0)
      const totalTalkTime = calls.reduce((sum: number, c: Call) => sum + (c.talkTime || 0), 0)
      const totalWaitTime = calls.reduce((sum: number, c: Call) => sum + (c.waitTime || 0), 0)
      const totalRingTime = calls.reduce((sum: number, c: Call) => sum + (c.ringTime || 0), 0)

      const avgDuration = inboundTotal > 0 ? totalDuration / inboundTotal : 0
      const avgTalkTime = inboundTotal > 0 ? totalTalkTime / inboundTotal : 0
      const avgWaitTime = inboundTotal > 0 ? totalWaitTime / inboundTotal : 0
      const avgRingTime = inboundTotal > 0 ? totalRingTime / inboundTotal : 0

      // Score distribution
      const excellent = scoredCalls.filter((c: Call) => c.score && c.score >= 85).length
      const good = scoredCalls.filter((c: Call) => c.score && c.score >= 70 && c.score < 85).length
      const needsImprovement = scoredCalls.filter((c: Call) => c.score && c.score >= 50 && c.score < 70).length
      const poor = scoredCalls.filter((c: Call) => c.score && c.score < 50).length

      // ZTP violations (from tags)
      const hipaaRisk = calls.filter((c: Call) => c.tags?.includes('hipaa-risk') || c.analysis?.tags?.includes('hipaa-risk')).length
      const medicalAdviceRisk = calls.filter((c: Call) => c.tags?.includes('medical-advice-risk') || c.analysis?.tags?.includes('medical-advice-risk')).length
      const unqualifiedTransfer = calls.filter((c: Call) => c.tags?.includes('unqualified-transfer') || c.analysis?.tags?.includes('unqualified-transfer')).length

      // Disposition from score ranges
      const qualified = scoredCalls.filter((c: Call) => c.score && c.score >= 80).length
      const warmLead = scoredCalls.filter((c: Call) => c.score && c.score >= 60 && c.score < 80).length
      const refer = scoredCalls.filter((c: Call) => c.score && c.score >= 40 && c.score < 60).length
      const doNotRefer = scoredCalls.filter((c: Call) => c.score && c.score < 40).length

      const kpiStats: KPIStats = {
        totalCalls: inboundTotal,
        answered,
        missed,
        voicemail,
        avgDuration,
        avgTalkTime,
        avgWaitTime,
        avgRingTime,
        avgScore,
        scoreDistribution: { excellent, good, needsImprovement, poor },
        ztpViolations: { hipaaRisk, medicalAdviceRisk, unqualifiedTransfer },
        disposition: { qualified, warmLead, refer, doNotRefer },
      }

      setStats({
        totalCalls: inboundTotal,
        analyzed: analyzedCount,
        hotLeads: hotLeadsCount,
        avgScore: avgScore.toString(),
        kpi: kpiStats,
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

  // fetchCTMCalls handles its own refresh via useEffect above
  // No separate auto-refresh needed for fetchStats since CTM stats endpoint doesn't return kpi anyway

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
    fetchStats({ manualOverride: { agentUid: agent?.uid } })
  }, [allAgents, fetchStats])

  const handleSyncNow = useCallback(async () => {
    await fetchStats({ blocking: true })
  }, [fetchStats])

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
        const analyzedCount = result.results?.length || 0
        setAnalyzeProgress(`Analyzed ${analyzedCount} calls!`)
        await fetchCTMCalls()
        setTimeout(() => setAnalyzeProgress(''), 3000)
      } else {
        const errorData = await analyzeRes.json().catch(() => ({}))
        setError(errorData.error || `Analysis failed (${analyzeRes.status})`)
        setTimeout(() => setError(null), 5000)
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
    isSyncing,
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