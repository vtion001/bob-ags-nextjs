'use client'

import React, { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import StatsCard from '@/components/StatsCard'
import CallTable from '@/components/CallTable'
import { Call } from '@/lib/ctm'

interface DashboardStats {
  totalCalls: number
  analyzed: number
  hotLeads: number
  avgScore: string
}

export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    analyzed: 0,
    hotLeads: 0,
    avgScore: '0',
  })
  const [recentCalls, setRecentCalls] = useState<Call[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/ctm/dashboard/stats?limit=100&hours=168')
      if (!res.ok) throw new Error('Failed to fetch data')
      const data = await res.json()
      setStats(data.stats)
      setRecentCalls(data.recentCalls || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Monitor and analyze your calls in real-time</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={handleRefresh}
            isLoading={isRefreshing}
          >
            Refresh Data
          </Button>
          <Button variant="primary" size="md">
            Run Analysis
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-4 mb-6 bg-red-500/10 border border-red-500/20">
          <p className="text-red-400">{error}</p>
          <p className="text-slate-400 text-sm mt-1">Please check your CTM credentials in .env</p>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Total Calls"
          value={stats.totalCalls}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.021.061.04.123.057.187l1.068 5.339a1 1 0 01-.93 1.296h-1.924a1 1 0 01-.997-.92L4.3 6.513c-.026-.146-.053-.291-.082-.434A1 1 0 013.153 5H3a1 1 0 01-1-1V3z" />
            </svg>
          }
          trend={{ value: 12, direction: 'up' }}
        />
        <StatsCard
          label="Analyzed"
          value={`${stats.analyzed}/${stats.totalCalls}`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatsCard
          label="Hot Leads"
          value={stats.hotLeads}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.266-.526.75-.36 1.158.328.808.454 1.703.454 2.674 0 1.553-.37 3.078-1.083 4.413.071.165.136.33.201.492.126.277.208.576.208.906 0 .893-.36 1.702-.94 2.289a1 1 0 001.415 1.414c.822-.822 1.333-1.96 1.333-3.203 0-.339-.027-.674-.08-1.003.686-1.46 1.081-3.081 1.081-4.762 0-1.2-.132-2.371-.382-3.5.226-.617.733-1.058 1.341-1.058.981 0 1.793.795 1.8 1.772.007.09.01.18.01.27 0 1.03-.244 2.006-.68 2.87.313.29.64.56.977.776.604.404 1.266.72 1.964.93.504.144 1.028.226 1.567.226 1.654 0 3.173-.447 4.506-1.23.177-.106.35-.218.519-.336a1 1 0 10-1.219-1.612c-.134.1-.268.2-.406.3-1.09.766-2.408 1.209-3.806 1.209-.42 0-.835-.04-1.24-.118-.327.073-.666.11-1.013.11-.982 0-1.793-.795-1.8-1.773a5.946 5.946 0 00-.01-.269zM8.596 4.001A1 1 0 007.18 2.586c-.822.822-1.333 1.96-1.333 3.203 0 .339.027.674.08 1.003-.686 1.46-1.081 3.081-1.081 4.762 0 1.2.132 2.371.382 3.5-.226.617-.733 1.058-1.341 1.058-.981 0-1.793-.795-1.8-1.772a5.946 5.946 0 00-.01-.269c0-1.03.244-2.006.68-2.87-.313-.29-.64-.56-.977-.776-.604-.404-1.266-.72-1.964-.93-.504-.144-1.028-.226-1.567-.226-1.654 0-3.173.447-4.506 1.23-.177.106-.35.218-.519.336a1 1 0 101.219 1.612c.134-.1.268-.2.406-.3 1.09-.766 2.408-1.209 3.806-1.209.42 0 .835.04 1.24.118.327-.073.666-.11 1.013-.11.982 0 1.793.795 1.8 1.773.008.09.01.18.01.269 0 1.03-.244 2.006-.68 2.87.313.29.64.56.977.776.604.404 1.266.72 1.964.93.504.144 1.028.226 1.567.226 1.654 0 3.173-.447 4.506-1.23.177-.106.35-.218.519-.336a1 1 0 10-1.219-1.612c-.134.1-.268.2-.406.3-1.09.766-2.408 1.209-3.806 1.209-.42 0-.835-.04-1.24-.118-.327.073-.666.11-1.013.11-.982 0-1.793-.795-1.8-1.773-.008-.09-.01-.18-.01-.269 0-1.03.244-2.006.68-2.87-.313-.29-.64-.56-.977-.776-.604-.404-1.266-.72-1.964-.93-.504-.144-1.028-.226-1.567-.226-1.654 0-3.173.447-4.506 1.23z" clipRule="evenodd" />
            </svg>
          }
          trend={{ value: 8, direction: 'up' }}
        />
        <StatsCard
          label="Avg Score"
          value={`${stats.avgScore}%`}
          icon={
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          }
        />
      </div>

      {/* Recent Calls */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">Recent Calls</h2>
          <p className="text-slate-400 text-sm mt-1">Your latest 10 calls with analysis</p>
        </div>
        <CallTable calls={recentCalls} />
      </div>
    </div>
  )
}
