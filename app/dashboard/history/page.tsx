'use client'

import React, { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import CallTable from '@/components/dashboard/CallTable'
import { useCallHistory } from '@/hooks/dashboard/useCallHistory'
import { HistoryFilters, HistoryStats } from '@/components/history'
import { useAuth } from '@/contexts/AuthContext'

interface SyncPreview {
  callsAvailable: number
  callsInSupabase: number
}

interface AnalyzeStatus {
  unanalyzedCount: number
  analyzedCount: number
}

interface AnalyzeResult {
  callId: string
  success: boolean
  score?: number
  sentiment?: string
  disposition?: string
  error?: string
}

export default function HistoryPage() {
  const { isAdmin, ctmAgentId, permissions } = useAuth()
  const {
    filteredCalls,
    agentProfiles,
    userGroups,
    isLoading,
    isRefreshing,
    isSearching,
    isSyncing,
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
    handleSearch,
    handleExport,
  } = useCallHistory()

  const [isBulkSyncing, setIsBulkSyncing] = useState(false)
  const [showSyncDialog, setShowSyncDialog] = useState(false)
  const [syncPreview, setSyncPreview] = useState<SyncPreview | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)

  const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false)
  const [showAnalyzeDialog, setShowAnalyzeDialog] = useState(false)
  const [analyzeStatus, setAnalyzeStatus] = useState<AnalyzeStatus | null>(null)
  const [analyzeProgress, setAnalyzeProgress] = useState<{ current: number; total: number; results: AnalyzeResult[] } | null>(null)
  const [isLoadingAnalyzeStatus, setIsLoadingAnalyzeStatus] = useState(false)

  // Auto-filter to user's assigned agent for non-admin users
  useEffect(() => {
    if (!isAdmin && ctmAgentId && agentIdFilter === '') {
      setAgentIdFilter(ctmAgentId)
    }
  }, [isAdmin, ctmAgentId, agentIdFilter, setAgentIdFilter])

  const handleBulkSyncClick = async () => {
    setIsLoadingPreview(true)
    setShowSyncDialog(true)
    try {
      const res = await fetch('/api/ctm/calls/bulk-sync', { method: 'GET' })
      if (!res.ok) {
        setSyncPreview(null)
        return
      }
      const data = await res.json()
      setSyncPreview(data)
    } catch (err) {
      console.error('Failed to get sync preview:', err)
      setSyncPreview(null)
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleConfirmBulkSync = async () => {
    setShowSyncDialog(false)
    setIsBulkSyncing(true)
    try {
      const res = await fetch('/api/ctm/calls/bulk-sync', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        alert(`Successfully synced ${data.callsSynced} calls to Supabase!`)
        handleRefresh()
      } else {
        alert('Bulk sync failed: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Bulk sync failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsBulkSyncing(false)
    }
  }

  const handleBulkAnalyzeClick = async () => {
    setIsLoadingAnalyzeStatus(true)
    setShowAnalyzeDialog(true)
    try {
      const res = await fetch('/api/calls/bulk-analyze', { method: 'GET' })
      if (res.ok) {
        const data = await res.json()
        setAnalyzeStatus(data)
      } else {
        setAnalyzeStatus(null)
      }
    } catch (err) {
      console.error('Failed to get analyze status:', err)
      setAnalyzeStatus(null)
    } finally {
      setIsLoadingAnalyzeStatus(false)
    }
  }

  const handleConfirmBulkAnalyze = async () => {
    setShowAnalyzeDialog(false)
    setIsBulkAnalyzing(true)
    setAnalyzeProgress({ current: 0, total: 0, results: [] })
    try {
      let offset = 0
      const limit = 20
      const allResults: AnalyzeResult[] = []

      while (true) {
        const res = await fetch('/api/calls/bulk-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit, offset })
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || 'Bulk analyze failed')
        }

        const data = await res.json()
        if (data.processed === 0) break

        allResults.push(...data.results)
        setAnalyzeProgress({
          current: allResults.length,
          total: data.unanalyzedCount || allResults.length,
          results: allResults
        })

        if (data.processed < limit) break
        offset += limit

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const successCount = allResults.filter(r => r.success).length
      alert(`Bulk analyze complete! Successfully analyzed ${successCount} of ${allResults.length} calls.`)
      handleRefresh()
    } catch (err) {
      alert('Bulk analyze failed: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setIsBulkAnalyzing(false)
      setAnalyzeProgress(null)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Call History</h1>
        <p className="text-navy-500">Search and filter your call history</p>
      </div>

      {error && !isLoading && (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-red-600 font-medium">{error}</p>
            {error.includes('log in') && (
              <Button variant="primary" size="sm" onClick={() => window.location.href = '/'}>
                Go to Login
              </Button>
            )}
          </div>
        </Card>
      )}

      <Card className="p-6 mb-6">
        <HistoryFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          agentIdFilter={agentIdFilter}
          onAgentIdChange={setAgentIdFilter}
          agentProfiles={agentProfiles}
          groupFilter={groupFilter}
          onGroupFilterChange={setGroupFilter}
          userGroups={userGroups}
          scoreFilter={scoreFilter}
          onScoreFilterChange={setScoreFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          analyzedOnly={analyzedOnly}
          onAnalyzedOnlyChange={setAnalyzedOnly}
          onRefresh={handleRefresh}
          onSearch={handleSearch}
          onBulkSync={handleBulkSyncClick}
          isRefreshing={isRefreshing}
          isSearching={isSearching}
          isBulkSyncing={isBulkSyncing}
          isSyncing={isSyncing}
        />
      </Card>

      <HistoryStats calls={[]} filteredCalls={filteredCalls} />

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-navy-900">Results</h2>
          <div className="flex gap-3">
            {(isAdmin || permissions.can_run_analysis) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBulkAnalyzeClick}
                isLoading={isBulkAnalyzing}
              >
                Bulk Analyze
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              disabled={filteredCalls.length === 0}
            >
              Export CSV
            </Button>
          </div>
        </div>
        <CallTable calls={filteredCalls} />
      </div>

      {filteredCalls.length > 0 && (
        <div className="text-center text-navy-500 text-sm">
          Showing {filteredCalls.length} calls
        </div>
      )}

      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Sync</DialogTitle>
            <DialogDescription>
              {isLoadingPreview ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-navy-200 border-t-navy-600 animate-spin" />
                  Loading sync preview...
                </span>
              ) : syncPreview ? (
                <>
                  This will sync all calls from CallTrackingMetrics (CTM) to Supabase.
                  <br /><br />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Calls available in CTM:</span>
                      <span className="font-semibold">{(syncPreview.callsAvailable ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Calls currently in Supabase:</span>
                      <span className="font-semibold">{(syncPreview.callsInSupabase ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>New calls to add:</span>
                      <span className="font-semibold text-green-600">
                        {Math.max(0, (syncPreview.callsAvailable ?? 0) - (syncPreview.callsInSupabase ?? 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                'Failed to load sync preview'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowSyncDialog(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmBulkSync} disabled={isLoadingPreview || !syncPreview}>
              Sync Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAnalyzeDialog} onOpenChange={setShowAnalyzeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Analyze Calls</DialogTitle>
            <DialogDescription>
              {isBulkAnalyzing ? (
                analyzeProgress ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-navy-200 border-t-navy-600 animate-spin" />
                      Analyzing calls...
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Processed:</span>
                        <span className="font-semibold">{analyzeProgress.current} / {analyzeProgress.total || '?'}</span>
                      </div>
                      <div className="w-full bg-navy-100 rounded-full h-2">
                        <div
                          className="bg-navy-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${analyzeProgress.total ? (analyzeProgress.current / analyzeProgress.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  'Starting analysis...'
                )
              ) : isLoadingAnalyzeStatus ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-navy-200 border-t-navy-600 animate-spin" />
                  Loading status...
                </span>
              ) : analyzeStatus ? (
                <>
                  This will run QA analysis on all calls in Supabase that have transcripts but no scores.
                  <br /><br />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Calls needing analysis:</span>
                      <span className="font-semibold text-orange-600">{analyzeStatus.unanalyzedCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Already analyzed:</span>
                      <span className="font-semibold text-green-600">{analyzeStatus.analyzedCount.toLocaleString()}</span>
                    </div>
                  </div>
                  {analyzeStatus.unanalyzedCount === 0 && (
                    <p className="mt-4 text-green-600 font-medium">
                      All available calls have already been analyzed!
                    </p>
                  )}
                </>
              ) : (
                'Failed to load analyze status'
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAnalyzeDialog(false)} disabled={isBulkAnalyzing}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmBulkAnalyze}
              disabled={isLoadingAnalyzeStatus || isBulkAnalyzing || !analyzeStatus || analyzeStatus.unanalyzedCount === 0}
            >
              {isBulkAnalyzing ? 'Analyzing...' : 'Analyze Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}