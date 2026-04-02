'use client'

import React, { useState } from 'react'
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
import CallTable from '@/components/CallTable'
import { useCallHistory } from '@/hooks/dashboard/useCallHistory'
import { HistoryFilters, HistoryStats } from '@/components/history'

interface SyncPreview {
  callsAvailable: number
  callsInSupabase: number
}

export default function HistoryPage() {
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
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={filteredCalls.length === 0}
          >
            Export CSV
          </Button>
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
                  <div className="w-4 h-4 border-2 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
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
    </div>
  )
}