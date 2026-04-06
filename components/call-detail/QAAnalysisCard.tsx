import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import type { CriterionResult } from '@/lib/ai'

const CATEGORY_ORDER = ['Opening', 'Probing', 'Qualification', 'Closing', 'Compliance']

// ZTP criteria that result in automatic FAIL
const ZTP_CRITERIA = ['3.4', '5.1', '5.2']

// Major criteria (single mark = coaching/FAIL)
const MAJOR_CRITERIA = ['2.1', '2.2', '2.3', '3.1', '3.2', '3.3', '3.5', '3.7', '4.1', '5.3', '5.4', '5.5']

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

function getSeverity(criterionId: string): 'MINOR' | 'MAJOR' | 'ZTP' {
  if (ZTP_CRITERIA.includes(criterionId)) return 'ZTP'
  if (MAJOR_CRITERIA.includes(criterionId)) return 'MAJOR'
  return 'MINOR'
}

function getPointsDeducted(severity: string, passed: boolean): number {
  if (passed) return 0
  if (severity === 'ZTP') return 0 // Automatic FAIL, shown separately
  if (severity === 'MAJOR') return 5
  return 2 // MINOR
}

export default function QAAnalysisCard({ rubricResults, rubricBreakdown, isAnalyzing, hasTranscript, onRunAnalysis }: QAAnalysisCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [showSummary, setShowSummary] = useState(true)

  const passedCount = (rubricResults || []).filter(r => r.pass).length
  const failedCount = (rubricResults || []).filter(r => !r.pass && !r.ztp).length
  const totalCount = (rubricResults || []).length

  // Calculate scoring summary
  const minorFailures = (rubricResults || []).filter(r => !r.pass && !r.ztp && getSeverity(r.id) === 'MINOR').length
  const majorFailures = (rubricResults || []).filter(r => !r.pass && !r.ztp && getSeverity(r.id) === 'MAJOR').length
  const ztpViolations = (rubricResults || []).filter(r => !r.pass && r.ztp).length

  const minorPoints = Math.min(minorFailures * 2, 4)
  const majorPoints = majorFailures * 5
  const totalPointsDeducted = minorPoints + majorPoints
  const finalScore = Math.max(0, 100 - totalPointsDeducted)
  const result = ztpViolations > 0 ? 'FAIL' : finalScore >= 70 ? 'PASS' : 'FAIL'

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
          <h3 className="text-lg font-bold text-navy-900">QA Analysis Rubric</h3>
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
        <div>
          {/* Table Header */}
          <div className="px-4 py-2 bg-navy-800 text-white text-xs font-semibold grid grid-cols-12 gap-2">
            <div className="col-span-1">ID</div>
            <div className="col-span-4">Opening</div>
            <div className="col-span-2 text-center">Mark</div>
            <div className="col-span-2 text-center">Points Deducted</div>
            <div className="col-span-3">Evaluator Notes</div>
          </div>

          {/* Category Sections */}
          {CATEGORY_ORDER.map(category => {
            const items = (rubricResults || []).filter(r => r.category === category)
            if (items.length === 0) return null

            return (
              <div key={category} className="border-t border-navy-100">
                {/* Category Header Row */}
                <div className="px-4 py-1.5 bg-navy-50 text-navy-700 text-xs font-bold border-l-4 border-navy-800">
                  {category}
                </div>

                {/* Criteria Rows */}
                {items.map((item, idx) => {
                  const severity = getSeverity(item.id)
                  const passed = item.pass
                  const points = getPointsDeducted(severity, passed)

                  return (
                    <div key={item.id || idx} className="px-4 py-2 grid grid-cols-12 gap-2 items-center hover:bg-navy-50/30 text-xs border-t border-navy-50">
                      <div className="col-span-1 font-mono text-navy-500">{item.id}</div>
                      <div className="col-span-4 text-navy-800 font-medium">{item.criterion}</div>
                      <div className="col-span-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          passed
                            ? 'bg-green-100 text-green-700'
                            : severity === 'ZTP'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {passed ? 'Pass' : severity === 'ZTP' ? 'FAIL' : 'Fail'}
                        </span>
                      </div>
                      <div className="col-span-2 text-center">
                        {passed ? (
                          <span className="text-navy-400">0</span>
                        ) : severity === 'ZTP' ? (
                          <span className="text-red-600 font-semibold">Auto FAIL</span>
                        ) : (
                          <span className={`font-semibold ${points > 0 ? 'text-red-600' : 'text-navy-400'}`}>
                            -{points}
                          </span>
                        )}
                      </div>
                      <div className="col-span-3 text-navy-500 truncate">
                        {item.details || '-'}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Scoring Summary Section */}
          <div className="border-t-2 border-navy-800 mt-4">
            <button
              onClick={() => setShowSummary(!showSummary)}
              className="w-full px-4 py-2 flex items-center justify-between bg-navy-800 text-white hover:bg-navy-700 transition-colors"
            >
              <span className="font-semibold text-sm">SCORING LEGEND & SUMMARY</span>
              <svg className={`w-4 h-4 transition-transform ${showSummary ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSummary && (
              <div className="p-4 bg-navy-50">
                {/* Legend */}
                <div className="mb-4 text-xs text-navy-600">
                  <p className="font-semibold mb-1">SCORING LEGEND</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">MINOR</span>
                      <span>-2 pts per mark, Max 4 pts accumulated = COACHING or FAIL</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">MAJOR</span>
                      <span>-5 pts per mark, 1 Major mark = COACHING or FAIL</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-red-600">ZTP</span>
                      <span>Automatic FAIL</span>
                    </div>
                  </div>
                </div>

                {/* Summary Table */}
                <div className="bg-white rounded-lg border border-navy-200 overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-navy-100 text-navy-700">
                        <th className="px-3 py-2 text-left font-semibold">Category</th>
                        <th className="px-3 py-2 text-center font-semibold">Failures</th>
                        <th className="px-3 py-2 text-center font-semibold">Points Deducted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-100">
                      <tr className="hover:bg-navy-50">
                        <td className="px-3 py-2 text-navy-700">Minor Infractions</td>
                        <td className="px-3 py-2 text-center text-navy-600">{minorFailures}</td>
                        <td className="px-3 py-2 text-center text-navy-600">{minorPoints}</td>
                      </tr>
                      <tr className="hover:bg-navy-50">
                        <td className="px-3 py-2 text-navy-700">Major Infractions</td>
                        <td className="px-3 py-2 text-center text-navy-600">{majorFailures}</td>
                        <td className="px-3 py-2 text-center text-navy-600">{majorPoints}</td>
                      </tr>
                      <tr className="hover:bg-navy-50">
                        <td className="px-3 py-2 text-red-700 font-medium">ZTP Violations</td>
                        <td className="px-3 py-2 text-center text-red-600 font-semibold">{ztpViolations}</td>
                        <td className="px-3 py-2 text-center text-red-500">-</td>
                      </tr>
                      <tr className="bg-navy-100 font-semibold">
                        <td className="px-3 py-2 text-navy-800">Total Points Deducted</td>
                        <td className="px-3 py-2 text-center text-navy-800">{minorFailures + majorFailures + ztpViolations}</td>
                        <td className="px-3 py-2 text-center text-navy-800">{totalPointsDeducted}</td>
                      </tr>
                      <tr className="bg-navy-800 text-white">
                        <td className="px-3 py-2">Final QA Score</td>
                        <td className="px-3 py-2 text-center">{totalCount} criteria</td>
                        <td className="px-3 py-2 text-center font-bold">{finalScore}%</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Result */}
                  <div className={`px-4 py-3 text-center font-bold text-lg ${
                    result === 'PASS'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    RESULT: {result}
                    {ztpViolations > 0 && (
                      <span className="ml-2 text-sm">(ZTP Violation - Immediate Action Required)</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}