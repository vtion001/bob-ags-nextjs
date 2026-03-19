'use client'

import React, { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
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
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState<string>('')
  const [autoRefresh, setAutoRefresh] = useState(true)
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
      
      const inboundCalls = (data.recentCalls || []).filter(
        (call: Call) => call.direction === 'inbound'
      )
      
      const inboundTotal = (data.stats.totalCalls || 0)
      
      setStats({
        ...data.stats,
        totalCalls: inboundTotal,
      })
      setRecentCalls(inboundCalls)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      fetchData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData()
    setIsRefreshing(false)
  }

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh)
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setAnalyzeProgress('Fetching calls...')
    
    try {
      const callsRes = await fetch('/api/ctm/calls?limit=50&hours=168&direction=inbound')
      if (!callsRes.ok) throw new Error('Failed to fetch calls')
      const callsData = await callsRes.json()
      
      const callsWithoutAnalysis = (callsData.calls || []).filter(
        (c: Call) => c.direction === 'inbound' && !c.score && !c.analysis
      )
      
      if (callsWithoutAnalysis.length === 0) {
        setAnalyzeProgress('All calls already analyzed!')
        setTimeout(() => setAnalyzeProgress(''), 2000)
        setIsAnalyzing(false)
        return
      }

      const callIds = callsWithoutAnalysis.map((c: Call) => c.id)
      setAnalyzeProgress(`Analyzing ${callIds.length} calls...`)
      
      const analyzeRes = await fetch('/api/ctm/calls/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callIds }),
      })
      
      if (!analyzeRes.ok) throw new Error('Analysis failed')
      
      const result = await analyzeRes.json()
      setAnalyzeProgress(`Analyzed ${result.analyzed} calls successfully!`)
      
      await fetchData()
      
      setTimeout(() => setAnalyzeProgress(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Dashboard</h1>
          <p className="text-navy-500">Monitor and analyze your calls in real-time</p>
        </div>0
        <div className="flex gap-3 items-center">
          <Button
            variant="secondary"
            size="md"
            onClick={handleRefresh}
            isLoading={isRefreshing}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </Button>
          <button
            onClick={toggleAutoRefresh}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            <svg className={`w-4 h-4 ${autoRefresh ? 'animate-spin-slow' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {autoRefresh ? 'Auto' : 'Paused'}
          </button>
          <Button 
            variant="primary" 
            size="md"
            onClick={handleAnalyze}
            isLoading={isAnalyzing}
          >
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
              <p className="text-navy-500 text-sm mt-1">Please check your CTM credentials in .env</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Total Calls"
          value={stats.totalCalls}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      <div>
        <div className="mb-5">
          <h2 className="text-xl font-bold text-navy-900">Recent Calls</h2>
          <p className="text-navy-500 text-sm mt-1">Latest 10 calls with analysis</p>
        </div>
        <CallTable calls={recentCalls} />
      </div>
    </div>
  )
}
