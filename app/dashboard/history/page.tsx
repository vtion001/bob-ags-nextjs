'use client'

import React, { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import CallTable from '@/components/CallTable'
import { Call } from '@/lib/ctm'

const AGENT_ID = 'USR606009BC8AF41AD2856B590114A37B63'

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [scoreFilter, setScoreFilter] = useState({ min: 0, max: 100 })
  const [filteredCalls, setFilteredCalls] = useState<Call[]>([])
  const [allCalls, setAllCalls] = useState<Call[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<string>(AGENT_ID)

  useEffect(() => {
    const fetchCalls = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const res = await fetch(`/api/ctm/calls?limit=500&hours=720&agent_id=${selectedAgent}`)
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Please log in to view calls')
          }
          throw new Error('Failed to fetch calls')
        }
        const data = await res.json()
        setAllCalls(data.calls || [])
        setFilteredCalls(data.calls || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setAllCalls([])
        setFilteredCalls([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchCalls()
  }, [selectedAgent])

  const handleSearch = () => {
    let results = [...allCalls]

    if (searchQuery) {
      results = results.filter(call =>
        call.phone.includes(searchQuery)
      )
    }

    if (scoreFilter.min > 0 || scoreFilter.max < 100) {
      results = results.filter(call =>
        call.score && call.score >= scoreFilter.min && call.score <= scoreFilter.max
      )
    }

    if (dateRange.start) {
      const startDate = new Date(dateRange.start)
      results = results.filter(call => new Date(call.timestamp) >= startDate)
    }

    if (dateRange.end) {
      const endDate = new Date(dateRange.end)
      endDate.setHours(23, 59, 59, 999)
      results = results.filter(call => new Date(call.timestamp) <= endDate)
    }

    setFilteredCalls(results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
  }

  const handleExport = () => {
    const csv = [
      ['Time', 'Phone', 'Direction', 'Duration', 'Score', 'Status'],
      ...filteredCalls.map(call => [
        new Date(call.timestamp).toISOString(),
        call.phone,
        call.direction,
        `${Math.floor(call.duration / 60)}m ${call.duration % 60}s`,
        call.score || 'N/A',
        call.status,
      ]),
    ]

    const csvContent = csv.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'call_history.csv'
    a.click()
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Call History</h1>
        <p className="text-navy-500">Search and filter your call history</p>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 mb-6 bg-red-50 border border-red-200">
          <p className="text-red-600 font-medium">{error}</p>
          {error.includes('log in') && (
            <Button variant="primary" size="sm" className="mt-2" onClick={() => window.location.href = '/'}>
              Go to Login
            </Button>
          )}
        </Card>
      )}

      {/* Filters */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-bold text-navy-900 mb-4">Search & Filter</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full px-3 py-2 border border-navy-200 rounded-lg bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-500"
            >
              <option value={AGENT_ID}>Kiel Asiniero Phillies</option>
              <option value="">All Agents</option>
            </select>
          </div>

          <Input
            label="Phone Number"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by phone..."
          />

          <Input
            label="Min Score"
            type="number"
            min="0"
            max="100"
            value={scoreFilter.min}
            onChange={(e) => setScoreFilter(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))}
          />

          <Input
            label="Max Score"
            type="number"
            min="0"
            max="100"
            value={scoreFilter.max}
            onChange={(e) => setScoreFilter(prev => ({ ...prev, max: parseInt(e.target.value) || 100 }))}
          />

          <div className="flex items-end">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleSearch}
              isLoading={isLoading}
            >
              Search
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />

          <Input
            label="End Date"
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>
      </Card>

      {/* Results Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-navy-500 text-sm">Total Results</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">{filteredCalls.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-navy-500 text-sm">Hot Leads</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {filteredCalls.filter(c => c.score && c.score >= 75).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-navy-500 text-sm">Avg Score</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">
            {filteredCalls.length > 0
              ? Math.round(filteredCalls.reduce((sum, c) => sum + (c.score || 0), 0) / filteredCalls.length)
              : 0}
            %
          </p>
        </Card>
      </div>

      {/* Call Table */}
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

      {/* Pagination info */}
      {filteredCalls.length > 0 && (
        <div className="text-center text-navy-500 text-sm">
          Showing {filteredCalls.length} of {allCalls.length} calls
        </div>
      )}
    </div>
  )
}
