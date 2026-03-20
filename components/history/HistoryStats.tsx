import React from 'react'
import Card from '@/components/ui/Card'
import { Call } from '@/lib/ctm'

interface HistoryStatsProps {
  calls: Call[]
  filteredCalls: Call[]
}

export default function HistoryStats({ calls, filteredCalls }: HistoryStatsProps) {
  const hotLeads = filteredCalls.filter(c => c.score && c.score >= 75).length
  const avgScore = filteredCalls.length > 0
    ? Math.round(filteredCalls.reduce((sum, c) => sum + (c.score || 0), 0) / filteredCalls.length)
    : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card className="p-4">
        <p className="text-navy-500 text-sm">Total Results</p>
        <p className="text-2xl font-bold text-navy-900 mt-1">{filteredCalls.length}</p>
      </Card>
      <Card className="p-4">
        <p className="text-navy-500 text-sm">Hot Leads</p>
        <p className="text-2xl font-bold text-navy-900 mt-1">{hotLeads}</p>
      </Card>
      <Card className="p-4">
        <p className="text-navy-500 text-sm">Avg Score</p>
        <p className="text-2xl font-bold text-navy-900 mt-1">{avgScore}%</p>
      </Card>
    </div>
  )
}