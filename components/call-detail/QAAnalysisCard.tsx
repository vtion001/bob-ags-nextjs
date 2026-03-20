import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import type { CriterionResult } from '@/lib/ai'

const CATEGORY_ORDER = ['Opening', 'Probing', 'Qualification', 'Closing', 'Compliance']

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
  hasTranscript?: boolean
  onRunAnalysis?: () => Promise<unknown>
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

export default function QAAnalysisCard({ rubricResults, rubricBreakdown, isAnalyzing, hasTranscript, onRunAnalysis }: QAAnalysisCardProps) {
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
        {isAnalyzing ? (
          <div className="bg-navy-50 rounded-lg p-6 text-center">
            <div className="w-8 h-8 border-2 border-navy-200 border-t-navy-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-navy-700 font-medium">Running QA analysis...</p>
            <p className="text-navy-400 text-sm mt-1">Evaluating call against 25 criteria rubric...</p>
          </div>
        ) : (
          <div className="bg-navy-50 rounded-lg p-6 text-center">
            <svg className="w-10 h-10 text-navy-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-navy-600 font-medium mb-1">No QA analysis yet</p>
            {hasTranscript ? (
              <>
                <p className="text-navy-400 text-sm mb-4">
                  Score this call against the 25-point QA rubric.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onRunAnalysis}
                  isLoading={isAnalyzing}
                >
                  Run QA Analysis
                </Button>
              </>
            ) : (
              <p className="text-navy-400 text-sm">
                A transcript is required to run QA analysis. Transcription will be available once the call recording is processed by CTM.
              </p>
            )}
          </div>
        )}
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
        <svg className={`w-5 h-5 text-navy-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
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
                <div className="px-4 py-3 flex items-center justify-between border-l-4 border-l-navy-800 bg-navy-50/30">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs rounded font-bold bg-navy-800 text-white">
                      {category}
                    </span>
                    <span className="text-xs text-navy-400">
                      {items.filter(i => i.pass).length}/{items.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-navy-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${catPercent >= 70 ? 'bg-green-500' : catPercent >= 40 ? 'bg-navy-500' : 'bg-red-500'}`}
                          style={{ width: `${catPercent}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${catPercent >= 70 ? 'text-green-600' : catPercent >= 40 ? 'text-navy-600' : 'text-red-600'}`}>
                        {catPercent}%
                      </span>
                  </div>
                </div>

                {items.map((item, idx) => (
                  <div key={item.id || idx} className="px-4 py-2.5 flex items-start gap-3 hover:bg-navy-50/30 transition-colors">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      item.pass
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
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
                        <p className={`text-sm font-medium ${item.pass ? 'text-navy-800' : 'text-navy-800'}`}>
                          {item.criterion || item.id}
                        </p>
                        {item.ztp && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">
                            ZTP
                          </span>
                        )}
                        {item.autoFail && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">
                            AUTO-FAIL
                          </span>
                        )}
                      </div>
                      {item.details && (
                        <p className="text-xs text-navy-400 mt-0.5">
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
