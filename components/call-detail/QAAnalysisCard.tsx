import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import type { CriterionResult } from '@/lib/ai'

const CATEGORY_ORDER = ['Opening', 'Probing', 'Qualification', 'Closing', 'Compliance']

const CATEGORY_COLORS: Record<string, string> = {
  Opening: 'border-l-blue-500 bg-blue-50/50',
  Probing: 'border-l-purple-500 bg-purple-50/50',
  Qualification: 'border-l-amber-500 bg-amber-50/50',
  Closing: 'border-l-teal-500 bg-teal-50/50',
  Compliance: 'border-l-red-500 bg-red-50/50',
}

const CATEGORY_BADGE: Record<string, string> = {
  Opening: 'bg-blue-100 text-blue-700',
  Probing: 'bg-purple-100 text-purple-700',
  Qualification: 'bg-amber-100 text-amber-700',
  Closing: 'bg-teal-100 text-teal-700',
  Compliance: 'bg-red-100 text-red-700',
}

const SEVERITY_BADGE: Record<string, string> = {
  Minor: 'bg-gray-100 text-gray-600',
  Major: 'bg-orange-100 text-orange-700',
  ZTP: 'bg-red-100 text-red-700',
}

const CATEGORY_SCORES: Record<string, string> = {}

interface QAAnalysisCardProps {
  rubricResults?: CriterionResult[]
  rubricBreakdown?: {
    opening_score: number
    opening_max: number
    probing_score: number
    probing_max: number
    qualification_score_detail: number
    qualification_max: number
    closing_score: number
    closing_max: number
    compliance_score: number
    compliance_max: number
  }
  isAnalyzing?: boolean
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600'
  if (score >= 70) return 'text-blue-600'
  if (score >= 50) return 'text-amber-600'
  return 'text-red-600'
}

function getScoreBg(score: number): string {
  if (score >= 85) return 'bg-green-500'
  if (score >= 70) return 'bg-blue-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

function getCategoryScore(breakdown: QAAnalysisCardProps['rubricBreakdown'], category: string): { score: number; max: number } {
  if (!breakdown) return { score: 0, max: 0 }
  switch (category) {
    case 'Opening': return { score: breakdown.opening_score, max: breakdown.opening_max }
    case 'Probing': return { score: breakdown.probing_score, max: breakdown.probing_max }
    case 'Qualification': return { score: breakdown.qualification_score_detail, max: breakdown.qualification_max }
    case 'Closing': return { score: breakdown.closing_score, max: breakdown.closing_max }
    case 'Compliance': return { score: breakdown.compliance_score, max: breakdown.compliance_max }
    default: return { score: 0, max: 0 }
  }
}

export default function QAAnalysisCard({ rubricResults, rubricBreakdown, isAnalyzing }: QAAnalysisCardProps) {
  const [expanded, setExpanded] = useState(true)

  const byCategory = (category: string) =>
    (rubricResults || []).filter(r => r.category === category)

  const passedCount = (rubricResults || []).filter(r => r.pass).length
  const failedCount = (rubricResults || []).filter(r => !r.pass).length
  const totalCount = (rubricResults || []).length

  if (!rubricResults || rubricResults.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-bold text-navy-900 mb-4">
          QA Breakdown
        </h3>
        <div className="bg-navy-50 rounded-lg p-4 text-navy-500 text-center">
          {isAnalyzing ? 'Running QA analysis...' : 'No QA criteria results yet. Analysis runs automatically after transcription.'}
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-0 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-navy-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="text-lg font-bold text-navy-900">QA Breakdown</h3>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
              {passedCount} passed
            </span>
            {failedCount > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-semibold">
                {failedCount} failed
              </span>
            )}
            <span className="text-navy-400">
              {totalCount} criteria
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-navy-400">
            Tap to {expanded ? 'collapse' : 'expand'}
          </span>
          <svg className={`w-5 h-5 text-navy-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="divide-y divide-navy-100">
          {CATEGORY_ORDER.map(category => {
            const items = byCategory(category)
            if (items.length === 0) return null
            const catScore = getCategoryScore(rubricBreakdown, category)
            const catPercent = catScore.max > 0 ? Math.round((catScore.score / catScore.max) * 100) : 0

            return (
              <div key={category}>
                <div className={`px-4 py-3 flex items-center justify-between border-l-4 ${CATEGORY_COLORS[category]}`}>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded font-bold ${CATEGORY_BADGE[category]}`}>
                      {category}
                    </span>
                    <span className="text-xs text-navy-400">
                      {items.filter(i => i.pass).length}/{items.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-navy-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getScoreBg(catPercent)}`}
                        style={{ width: `${catPercent}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${getScoreColor(catPercent)}`}>
                      {catPercent}%
                    </span>
                  </div>
                </div>

                {items.map((item, idx) => (
                  <div key={item.id || idx} className="px-4 py-2.5 flex items-start gap-3 hover:bg-navy-50/50 transition-colors">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      item.pass
                        ? 'bg-green-500 text-white'
                        : item.autoFail
                          ? 'bg-red-600 text-white'
                          : 'bg-red-400 text-white'
                    }`}>
                      {item.pass ? (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-medium ${item.pass ? 'text-green-700' : 'text-red-700'}`}>
                          {item.criterion || item.id}
                        </p>
                        {item.ztp && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">
                            ZTP
                          </span>
                        )}
                        {item.autoFail && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-200 text-red-800 rounded font-bold">
                            AUTO-FAIL
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${SEVERITY_BADGE[item.severity] || 'bg-gray-100 text-gray-600'}`}>
                          {item.severity}
                        </span>
                      </div>
                      {item.details && (
                        <p className={`text-xs mt-0.5 ${item.pass ? 'text-green-600' : 'text-red-600'}`}>
                          {item.details}
                        </p>
                      )}
                    </div>

                    <span className="text-[10px] text-navy-400 font-mono flex-shrink-0">
                      {item.id}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
