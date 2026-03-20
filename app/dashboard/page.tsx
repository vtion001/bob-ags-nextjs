'use client'

import React from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useDashboard } from '@/hooks/dashboard/useDashboard'
import { DashboardHeader, DashboardStats, DashboardRecentCalls } from '@/components/dashboard'

export default function DashboardPage() {
  const {
    isLoading,
    isRefreshing,
    isAnalyzing,
    analyzeProgress,
    autoRefresh,
    userGroups,
    allAgents,
    selectedGroup,
    handleGroupChange,
    selectedAgent,
    handleAgentChange,
    timeRange,
    setTimeRange,
    stats,
    recentCalls,
    error,
    liveMeta,
    userEmail,
    handleSyncNow,
    toggleAutoRefresh,
    handleAnalyze,
    getAvailableAgents,
  } = useDashboard()

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
      <DashboardHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        isAdmin={isAdmin}
        userGroups={userGroups}
        selectedGroup={selectedGroup}
        onGroupChange={handleGroupChange}
        selectedAgent={selectedAgent}
        onAgentChange={handleAgentChange}
        allAgents={allAgents}
        getAvailableAgents={getAvailableAgents}
        onSyncNow={handleSyncNow}
        isRefreshing={isRefreshing}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={toggleAutoRefresh}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

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

      <DashboardStats
        totalCalls={stats.totalCalls}
        analyzed={stats.analyzed}
        hotLeads={stats.hotLeads}
        avgScore={stats.avgScore}
      />

      <DashboardRecentCalls
        calls={recentCalls}
        isAdmin={isAdmin}
        assignedLabel={assignedLabel}
        userGroups={userGroups}
        selectedGroup={selectedGroup}
        allAgents={allAgents}
        selectedAgent={selectedAgent}
        timeRange={timeRange}
      />
    </div>
  )
}