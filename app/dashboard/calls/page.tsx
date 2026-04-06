'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import CallTable from '@/components/CallTable'
import { useAuth } from '@/contexts/AuthContext'
import { Call } from '@/lib/ctm'
import {
  PhoneIcon,
  ClockIcon,
  RefreshCwIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'

interface CallsStats {
  totalCalls: number
  answered: number
  missed: number
  avgDuration: number
  avgScore: number
}

const PAGE_SIZE = 100 // CTM API returns 200 per page, request 100 for safety

export default function CallsPage() {
  const router = useRouter()
  const { isAdmin, ctmAgentId, isLoading: authLoading } = useAuth()
  const [calls, setCalls] = useState<Call[]>([])
  const [stats, setStats] = useState<CallsStats>({
    totalCalls: 0,
    answered: 0,
    missed: 0,
    avgDuration: 0,
    avgScore: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const fetchCalls = useCallback(async (options: { phone?: string; page?: number } = {}) => {
    setIsLoading(true)
    setError(null)

    try {
      const hours = 8760 // 1 year
      const limit = PAGE_SIZE
      const page = options.page || 1
      const agentParam = ctmAgentId ? `&agent_id=${ctmAgentId}` : ''

      let url = `/api/ctm/calls?hours=${hours}&limit=${limit}&page=${page}${agentParam}`
      if (options.phone) {
        url = `/api/ctm/calls/search?phone=${encodeURIComponent(options.phone.replace(/\D/g, ''))}&hours=${hours}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch calls')

      const data = await res.json()
      const fetchedCalls: Call[] = data.calls || []

      // Calculate stats from fetched calls
      const totalCalls = fetchedCalls.length
      const answered = fetchedCalls.filter(c => c.status === 'completed' || c.status === 'active').length
      const missed = fetchedCalls.filter(c => c.status === 'missed').length
      const avgDuration = totalCalls > 0
        ? fetchedCalls.reduce((sum, c) => sum + (c.duration || 0), 0) / totalCalls
        : 0
      const scoredCalls = fetchedCalls.filter(c => c.score !== undefined && c.score !== null)
      const avgScore = scoredCalls.length > 0
        ? scoredCalls.reduce((sum, c) => sum + (c.score || 0), 0) / scoredCalls.length
        : 0

      setStats({
        totalCalls,
        answered,
        missed,
        avgDuration: Math.round(avgDuration),
        avgScore: Math.round(avgScore),
      })

      if (options.phone) {
        setCalls(fetchedCalls)
        setHasMore(false)
      } else {
        setCalls(prev => page === 1 ? fetchedCalls : [...prev, ...fetchedCalls])
        setHasMore(fetchedCalls.length === PAGE_SIZE)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calls')
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }, [ctmAgentId])

  // Initial fetch only when auth is ready and ctmAgentId is available
  useEffect(() => {
    if (!authLoading) {
      fetchCalls({ page: 1 })
    }
  }, [authLoading, fetchCalls])

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setCurrentPage(1)
      fetchCalls({ page: 1 })
      return
    }
    setIsSearching(true)
    setCurrentPage(1)
    fetchCalls({ phone: searchQuery })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleRefresh = () => {
    setCurrentPage(1)
    fetchCalls({ page: 1 })
  }

  const handleNextPage = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    fetchCalls({ page: nextPage })
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1
      setCurrentPage(prevPage)
      fetchCalls({ page: prevPage })
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Calls</h1>
        <p className="text-navy-500">View and analyze your call history</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <PhoneIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-navy-500">Total Calls</p>
              <p className="text-xl font-bold text-navy-900">{stats.totalCalls}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <PhoneIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-navy-500">Answered</p>
              <p className="text-xl font-bold text-green-600">{stats.answered}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <PhoneIcon className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-navy-500">Missed</p>
              <p className="text-xl font-bold text-red-600">{stats.missed}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-navy-500">Avg Duration</p>
              <p className="text-xl font-bold text-navy-900">{formatDuration(stats.avgDuration)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
              <span className="text-cyan-600 font-bold text-lg">%</span>
            </div>
            <div>
              <p className="text-sm text-navy-500">Avg Score</p>
              <p className="text-xl font-bold text-navy-900">
                {stats.avgScore > 0 ? `${stats.avgScore}%` : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              label="Search by Phone Number"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="(772) 766-9678 or 7727669678"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              variant="primary"
              onClick={handleSearch}
              isLoading={isSearching}
              disabled={isSearching}
            >
              <SearchIcon className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button
              variant="secondary"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <p className="text-red-600 font-medium">{error}</p>
        </Card>
      )}

      {/* Calls Table */}
      <Card className="overflow-hidden">
        {isLoading && calls.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-navy-100 border-t-navy-600 rounded-full animate-spin" />
              <p className="text-navy-500">Loading calls...</p>
            </div>
          </div>
        ) : calls.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <PhoneIcon className="w-12 h-12 text-navy-300 mb-3" />
            <p className="text-navy-600 font-medium mb-1">No calls found</p>
            <p className="text-navy-400 text-sm">
              {searchQuery ? 'Try a different phone number' : 'No calls in the selected time range'}
            </p>
          </div>
        ) : (
          <>
            <CallTable
              calls={calls}
              onCallClick={(callId) => router.push(`/dashboard/calls/${callId}`)}
              showPagination={false}
            />

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-navy-200 bg-navy-50">
              <p className="text-sm text-navy-500">
                Showing page {currentPage} ({calls.length} calls)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-navy-600 px-2">Page {currentPage}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore || isLoading}
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}