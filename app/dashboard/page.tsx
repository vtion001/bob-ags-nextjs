'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'
import StatsCard from '@/components/StatsCard'
import CallTable from '@/components/CallTable'
import Select from '@/components/ui/select'
import { Call } from '@/lib/ctm'

interface Agent {
  id: string
  uid: number
  name: string
  email: string
}

interface UserGroup {
  id: string
  name: string
  userIds: number[]
}

interface DashboardStats {
  totalCalls: number
  analyzed: number
  hotLeads: number
  avgScore: string
}

interface LiveCallsMeta {
  total: number
  isAdmin: boolean
  assignedGroupId: string | null
  assignedAgentId: string | null
  userEmail: string
}

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'custom'

function getHoursFromRange(range: TimeRange): number {
  switch (range) {
    case '24h': return 24
    case '7d': return 168
    case '30d': return 720
    case '90d': return 2160
    default: return 168
  }
}

function formatDateRange(range: TimeRange): string {
  switch (range) {
    case '24h': return 'Last 24 Hours'
    case '7d': return 'Last 7 Days'
    case '30d': return 'Last 30 Days'
    case '90d': return 'Last 90 Days'
    case 'custom': return 'Custom Range'
  }
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState<string>('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [allAgents, setAllAgents] = useState<Agent[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [selectedAgent, setSelectedAgent] = useState<string>('all')
  const [selectedAgentUid, setSelectedAgentUid] = useState<number | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
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

  // Check auth and load initial data
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

        // Fetch user permissions and settings in parallel
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

        // For non-admin users, fetch their CTM assignments
        if (!isAdmin) {
          const settingsRes = await fetch('/api/users/settings')
          if (settingsRes.ok) {
            const settingsData = await settingsRes.json()
            const settings = settingsData.settings || {}
            assignedGroupId = settings.ctm_user_group_id || null
            assignedAgentId = settings.ctm_agent_id || null

            // Auto-select based on user's CTM assignment
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

      // Fetch directly from CTM via the live-calls endpoint (instant, no cache)
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

      // Use meta.isAdmin to control filter visibility
      let calls: Call[] = data.calls || []

      // Client-side filter if server didn't filter (admin or no group/agent assignment)
      if (meta.isAdmin && !manualOverride?.groupId && !manualOverride?.agentUid) {
        if (selectedGroup !== 'all') {
          const group = userGroups.find(g => g.id === selectedGroup)
          if (group) {
            calls = calls.filter(call => {
              const aid = (call.agent as any)?.id || call.agent?.id
              if (!aid) return false
              const agent = allAgents.find(a => a.id === String(aid))
              return agent ? group.userIds.includes(agent.uid) : false
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

      // Filter to inbound only
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

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/ctm/agents')
      if (res.ok) {
        const data = await res.json()
        setAllAgents(data.agents || [])
        setUserGroups(data.userGroups || [])
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err)
    }
  }

  useEffect(() => {
    if (!isLoading && userEmail) {
      fetchCTMCalls()
    }
  }, [isLoading, userEmail])

  useEffect(() => {
    if (!isLoading) {
      fetchCTMCalls()
    }
  }, [timeRange, customStartDate, customEndDate, selectedAgentUid, selectedGroup])

  useEffect(() => {
    if (!autoRefresh || isLoading) return
    const interval = setInterval(() => {
      fetchCTMCalls()
    }, 30000)
    return () => clearInterval(interval)
  }, [autoRefresh, isLoading, fetchCTMCalls])

  const handleGroupChange = (groupId: string) => {
    setSelectedGroup(groupId)
    setSelectedAgent('all')
    setSelectedAgentUid(null)
    fetchCTMCalls({ groupId })
  }

  const handleAgentChange = (agentId: string) => {
    setSelectedAgent(agentId)
    const agent = allAgents.find(a => a.id === agentId)
    setSelectedAgentUid(agent?.uid || null)
    if (agent?.uid) {
      setSelectedGroup('all')
    }
    fetchCTMCalls({ agentUid: agent?.uid || undefined })
  }

  const handleSyncNow = async () => {
    setIsRefreshing(true)
    try {
      await fetchCTMCalls()
    } finally {
      setIsRefreshing(false)
    }
  }

  const toggleAutoRefresh = () => setAutoRefresh(!autoRefresh)

  const handleAnalyze = async () => {
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
  }

  const getAvailableAgents = (): Agent[] => {
    if (selectedGroup === 'all') return allAgents
    const group = userGroups.find(g => g.id === selectedGroup)
    if (!group) return []
    return allAgents.filter(agent => group.userIds.includes(agent.uid))
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-navy-100 border-t-navy-900 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const isAdmin = liveMeta?.isAdmin ?? false
  const assignedLabel = liveMeta?.assignedAgentId
    ? `Assigned Agent: ${allAgents.find(a => a.id === liveMeta.assignedAgentId)?.name || liveMeta.assignedAgentId}`
    : liveMeta?.assignedGroupId
    ? `Assigned Group: ${userGroups.find(g => String(g.id) === String(liveMeta.assignedGroupId))?.name || liveMeta.assignedGroupId}`
    : null

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Dashboard</h1>
          <p className="text-navy-500">
            {isAdmin ? 'All calls across your account' : assignedLabel || 'Your assigned calls'}
          </p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <Select
            value={timeRange}
            onChange={(v) => setTimeRange(v as TimeRange)}
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
              onChange={handleGroupChange}
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
              onChange={handleAgentChange}
              options={[
                { value: 'all', label: 'All Agents' },
                ...getAvailableAgents().map((a) => ({ value: a.id, label: a.name })),
              ]}
              className="w-40"
            />
          )}

          <Button variant="secondary" size="md" onClick={handleSyncNow} isLoading={isRefreshing}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync Now
          </Button>

          <button
            onClick={toggleAutoRefresh}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <svg className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {autoRefresh ? 'Auto' : 'Paused'}
          </button>

          <Button variant="primary" size="md" onClick={handleAnalyze} isLoading={isAnalyzing}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Run Analysis
          </Button>
        </div>
      </div>

      {analyzeProgress && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-blue-600 font-medium">{analyzeProgress}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-navy-500 text-sm mt-1">Check CTM credentials in Settings</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Total Calls"
          value={stats.totalCalls}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
        />
        <StatsCard
          label="Analyzed"
          value={`${stats.analyzed}/${stats.totalCalls}`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatsCard
          label="Hot Leads"
          value={stats.hotLeads}
          icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.266-.526.75-.36 1.158.328.808.454 1.703.454 2.674 0 1.553-.37 3.078-1.083 4.413.071.165.136.33.201.492.126.277.208.576.208.906 0 .893-.36 1.702-.94 2.289a1 1 0 001.415 1.414c.822-.822 1.333-1.96 1.333-3.203 0-.339-.027-.674-.08-1.003.686-1.46 1.081-3.081 1.081-4.762 0-1.2-.132-2.371-.382-3.5.226-.617.733-1.058 1.341-1.058.981 0 1.793.795 1.8 1.772.007.09.01.18.01.27 0 1.03-.244 2.006-.68 2.87.313.29.64.56.977.776.604.404 1.266.72 1.964.93.504.144 1.028.226 1.567.226 1.654 0 3.173-.447 4.506-1.23.177-.106.35-.218.519-.336a1 1 0 10-1.219-1.612c-.134.1-.268.2-.406.3-1.09.766-2.408 1.209-3.806 1.209-.42 0-.835-.04-1.24-.118-.327.073-.666.11-1.013.11-.982 0-1.793-.795-1.8-1.773a5.946 5.946 0 00-.01-.269z" clipRule="evenodd" /></svg>}
        />
        <StatsCard
          label="Avg Score"
          value={`${stats.avgScore}%`}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
      </div>

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
          <p className="text-navy-500 text-sm mt-1">{recentCalls.length} calls found</p>
        </div>
        <CallTable calls={recentCalls} />
      </div>
    </div>
  )
}
