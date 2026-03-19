'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { Call } from '@/lib/ctm'

export default function MonitorPage() {
  const router = useRouter()
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [pollingInterval, setPollingInterval] = useState(3)
  const [activeCalls, setActiveCalls] = useState<Call[]>([])
  const [recentAnalyzed, setRecentAnalyzed] = useState<Call[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchActiveCalls = useCallback(async () => {
    try {
      const res = await fetch('/api/ctm/active-calls')
      if (!res.ok) throw new Error('Failed to fetch active calls')
      const data = await res.json()
      setActiveCalls(data.calls || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }, [])

  const fetchRecentAnalyzed = useCallback(async () => {
    try {
      const res = await fetch('/api/ctm/dashboard/stats?limit=10&hours=1')
      if (!res.ok) throw new Error('Failed to fetch recent analysis')
      const data = await res.json()
      setRecentAnalyzed(data.recentCalls?.filter((c: Call) => c.score !== undefined) || [])
    } catch (err) {
      console.error('Error fetching recent analysis:', err)
    }
  }, [])

  useEffect(() => {
    if (isMonitoring) {
      fetchActiveCalls()
      fetchRecentAnalyzed()
      const interval = setInterval(() => {
        fetchActiveCalls()
        fetchRecentAnalyzed()
      }, pollingInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [isMonitoring, pollingInterval, fetchActiveCalls, fetchRecentAnalyzed])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getScoreBadge = (score?: number) => {
    if (!score) return null
    if (score >= 75) return { label: 'Hot', className: 'bg-red-500/20 text-red-400' }
    if (score >= 50) return { label: 'Warm', className: 'bg-amber-500/20 text-amber-400' }
    return { label: 'Cold', className: 'bg-slate-500/20 text-slate-400' }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 60) return `${minutes} minutes ago`
    const hours = Math.floor(diff / 3600000)
    return `${hours} hours ago`
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Live Monitor</h1>
        <p className="text-slate-400">Monitor active calls in real-time</p>
      </div>

      {/* Status Indicator */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></div>
            <span className="text-white font-semibold">
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Disabled'}
            </span>
          </div>
          <Button
            variant={isMonitoring ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => setIsMonitoring(!isMonitoring)}
          >
            {isMonitoring ? 'Stop' : 'Start'} Monitoring
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Settings */}
        <div className="bg-navy-900/50 rounded-lg p-4 space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Polling Interval (seconds)</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="60"
                value={pollingInterval}
                onChange={(e) => setPollingInterval(parseInt(e.target.value))}
                className="w-20"
              />
              <span className="text-slate-400 text-sm">seconds</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">Default: 3 seconds</p>
          </div>
        </div>
      </Card>

      {/* Active Calls */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Active Calls</h2>
        {activeCalls.length > 0 ? (
          <div className="space-y-4">
            {activeCalls.map(call => (
              <Card key={call.id} className="p-6 border border-navy-200">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white font-mono">{call.phone}</h3>
                    <p className="text-slate-400 text-sm mt-1">Duration: {formatDuration(call.duration)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-red-400 font-semibold text-sm">LIVE</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-navy-900/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Call Type</p>
                    <p className="text-white font-semibold mt-1 capitalize">{call.direction}</p>
                  </div>
                  <div className="bg-navy-900/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Status</p>
                    <p className="text-white font-semibold mt-1 capitalize">{call.status}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="primary" 
                    size="md" 
                    className="flex-1"
                    onClick={() => router.push(`/dashboard/calls/${call.id}`)}
                  >
                    View Details
                  </Button>
                  <Button variant="secondary" size="md" className="flex-1">
                    Quick Note
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-slate-500/10 rounded-lg">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-slate-400 text-lg">No active calls at the moment</p>
            <p className="text-slate-500 text-sm mt-1">Active calls will appear here when detected</p>
          </Card>
        )}
      </div>

      {/* Recent Analysis */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recent Analysis</h2>
        <Card className="p-6">
          {recentAnalyzed.length > 0 ? (
            <div className="space-y-3">
              {recentAnalyzed.map(call => {
                const badge = getScoreBadge(call.score)
                return (
                  <div 
                    key={call.id} 
                    className="flex items-center justify-between p-3 bg-navy-900/50 rounded-lg cursor-pointer hover:bg-navy-900/70 transition-colors"
                    onClick={() => router.push(`/dashboard/calls/${call.id}`)}
                  >
                    <div>
                      <p className="text-white font-medium">{call.phone}</p>
                      <p className="text-slate-400 text-sm">{formatTimeAgo(call.timestamp)}</p>
                    </div>
                    {badge && (
                      <span className={`px-3 py-1 text-xs rounded-full font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-center">No recent analysis available</p>
          )}
        </Card>
      </div>

      {/* Notification */}
      {activeCalls.length > 0 && isMonitoring && (
        <div className="fixed bottom-4 right-4 bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg flex items-center gap-2 animate-pulse">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>{activeCalls.length} active call{activeCalls.length > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}
