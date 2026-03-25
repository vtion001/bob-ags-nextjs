'use client'

import React, { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import type { CriterionResult } from '@/lib/ai'
import { useAuth } from '@/contexts/AuthContext'
import { CheckIcon, XIcon, Edit3Icon, SaveIcon, RotateCcwIcon, AlertTriangleIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_ORDER = ['Opening', 'Probing', 'Qualification', 'Closing', 'Compliance']

interface QAOverrideResult extends CriterionResult {
  overridden?: boolean
  overridePass?: boolean
  overrideNote?: string
}

interface QAManualOverrideCardProps {
  callId: string
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
  onOverrideSaved?: (overrides: QAOverrideResult[]) => void
}

function getCategoryScore(breakdown: QAManualOverrideCardProps['rubricBreakdown'], category: string): { score: number; max: number } {
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

function calculateManualScore(results: QAOverrideResult[], breakdown: QAManualOverrideCardProps['rubricBreakdown']): number {
  if (!breakdown) return 0
  
  let totalMax = 0
  let totalScore = 0

  for (const cat of CATEGORY_ORDER) {
    const catResults = results.filter(r => r.category === cat)
    if (catResults.length === 0) continue

    let catMax = 0
    let catScore = 0

    for (const r of catResults) {
      if (r.na) continue
      
      const points = r.ztp ? 10 : r.severity === 'Minor' ? 2 : r.severity === 'Major' ? 5 : 0
      catMax += points
      
      const isPass = r.overridden ? r.overridePass! : r.pass
      if (isPass) catScore += points
    }

    totalMax += catMax
    totalScore += catScore
  }

  if (totalMax === 0) return 0
  return Math.round((totalScore / totalMax) * 100)
}

export default function QAManualOverrideCard({ 
  callId, 
  rubricResults, 
  rubricBreakdown,
  onOverrideSaved 
}: QAManualOverrideCardProps) {
  const { role, permissions } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, QAOverrideResult>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isAdmin = role === 'admin'
  const canOverride = isAdmin || role === 'qa'

  useEffect(() => {
    if (rubricResults) {
      const initial: Record<string, QAOverrideResult> = {}
      for (const r of rubricResults) {
        initial[r.id] = { ...r }
      }
      setOverrides(initial)
    }
  }, [rubricResults])

  const toggleCriterion = (id: string) => {
    if (!canOverride) return
    
    setOverrides(prev => {
      const current = prev[id]
      if (!current) return prev
      
      const newOverrides = {
        ...prev,
        [id]: {
          ...current,
          overridden: true,
          overridePass: !current.overridePass,
        }
      }
      
      setHasChanges(true)
      return newOverrides
    })
  }

  const resetOverrides = () => {
    if (!rubricResults) return
    
    const initial: Record<string, QAOverrideResult> = {}
    for (const r of rubricResults) {
      initial[r.id] = { ...r }
    }
    setOverrides(initial)
    setHasChanges(false)
    setShowConfirm(false)
  }

  const saveOverrides = async () => {
    setIsSaving(true)
    try {
      const overrideList = Object.values(overrides).filter(o => o.overridden)
      
      const res = await fetch('/api/calls/qa-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId,
          overrides: overrideList.map(o => ({
            criterionId: o.id,
            overridePass: o.overridePass,
            originalPass: o.pass,
            overrideNote: o.overrideNote,
          })),
          manualScore: calculateManualScore(Object.values(overrides), rubricBreakdown),
        }),
      })

      if (res.ok) {
        setHasChanges(false)
        setShowConfirm(false)
        onOverrideSaved?.(Object.values(overrides))
      }
    } catch (err) {
      console.error('Failed to save overrides:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const byCategory = (category: string) =>
    Object.values(overrides).filter(r => r.category === category)

  const passedCount = Object.values(overrides).filter(r => r.overridden ? r.overridePass : r.pass).length
  const failedCount = Object.values(overrides).filter(r => !(r.overridden ? r.overridePass : r.pass)).length
  const totalCount = Object.values(overrides).length
  const overrideCount = Object.values(overrides).filter(r => r.overridden).length

  if (!rubricResults || rubricResults.length === 0) {
    return null
  }

  const manualScore = calculateManualScore(Object.values(overrides), rubricBreakdown)
  const originalScore = rubricBreakdown 
    ? Math.round(((rubricBreakdown.opening_score + rubricBreakdown.probing_score + rubricBreakdown.qualification_score_detail + rubricBreakdown.closing_score + rubricBreakdown.compliance_score) / 
        (rubricBreakdown.opening_max + rubricBreakdown.probing_max + rubricBreakdown.qualification_max + rubricBreakdown.closing_max + rubricBreakdown.compliance_max) * 100) || 0)
    : 0

  return (
    <Card className="p-0 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full p-4 flex items-center justify-between transition-colors",
          hasChanges ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-navy-50"
        )}
      >
        <div className="flex items-center gap-3">
          <Edit3Icon className={cn("w-5 h-5", hasChanges ? "text-amber-600" : "text-navy-600")} />
          <h3 className="text-lg font-bold text-navy-900">Manual QA Override</h3>
          <span className="flex items-center gap-1.5 text-xs">
            {canOverride ? (
              <>
                <span className={cn(
                  "px-2 py-0.5 rounded-full font-semibold",
                  hasChanges ? "bg-amber-100 text-amber-700" : "bg-navy-100 text-navy-700"
                )}>
                  {hasChanges ? "Unsaved changes" : "Enabled"}
                </span>
                {overrideCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">
                    {overrideCount} override{overrideCount !== 1 ? 's' : ''}
                  </span>
                )}
              </>
            ) : (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-semibold">
                View Only
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && canOverride && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowConfirm(true)
              }}
              className="mr-2"
            >
              <SaveIcon className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          )}
          {hasChanges && canOverride && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                resetOverrides()
              }}
              className="mr-2"
            >
              <RotateCcwIcon className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
          <svg className={cn("w-5 h-5 text-navy-400 transition-transform", expanded ? "rotate-180" : "")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!canOverride && (
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <AlertTriangleIcon className="w-3.5 h-3.5" />
            Only QA and Admin roles can modify criteria. Contact your administrator to request changes.
          </p>
        </div>
      )}

      {expanded && (
        <>
          {hasChanges && (
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Score will be recalculated: <span className="font-bold">{manualScore}</span>
                  </p>
                  <p className="text-xs text-amber-600">
                    Original AI score: {originalScore} → New manual score: {manualScore}
                    {manualScore !== originalScore && (
                      <span className={cn("ml-2 font-semibold", manualScore > originalScore ? "text-green-600" : "text-red-600")}>
                        ({manualScore > originalScore ? '+' : ''}{manualScore - originalScore})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-navy-100">
            {CATEGORY_ORDER.map(category => {
              const items = byCategory(category)
              if (items.length === 0) return null
              const catScore = getCategoryScore(rubricBreakdown, category)

              return (
                <div key={category}>
                  <div className="px-4 py-3 flex items-center justify-between border-l-4 border-l-navy-800 bg-navy-50/30">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-xs rounded font-bold bg-navy-800 text-white">
                        {category}
                      </span>
                      <span className="text-xs text-navy-400">
                        {items.filter(i => i.overridden ? i.overridePass : i.pass).length}/{items.length}
                        {items.some(i => i.overridden) && (
                          <span className="ml-1 text-blue-600">
                            ({items.filter(i => i.overridden).length} overridden)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {items.map((item, idx) => {
                    const isPass = item.overridden ? item.overridePass! : item.pass
                    const isOverridden = item.overridden

                    return (
                      <div 
                        key={item.id || idx} 
                        className={cn(
                          "px-4 py-2.5 flex items-start gap-3 transition-colors",
                          canOverride && "hover:bg-navy-50/30 cursor-pointer",
                          isOverridden && "bg-amber-50/30"
                        )}
                        onClick={() => toggleCriterion(item.id)}
                      >
                        <div className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all",
                          isPass 
                            ? "bg-green-500 border-green-500 text-white" 
                            : "bg-white border-red-500 text-transparent",
                          canOverride && "cursor-pointer hover:scale-110",
                          isOverridden && "ring-2 ring-amber-400 ring-offset-1"
                        )}>
                          {isPass ? (
                            <CheckIcon className="w-3.5 h-3.5" />
                          ) : (
                            <XIcon className="w-3.5 h-3.5 text-red-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-navy-800">
                              {item.criterion || item.id}
                            </p>
                            {item.na && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-medium">
                                N/A
                              </span>
                            )}
                            {item.ztp && !item.na && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">
                                ZTP
                              </span>
                            )}
                            {item.autoFail && !item.na && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-bold">
                                AUTO-FAIL
                              </span>
                            )}
                            {isOverridden && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium flex items-center gap-0.5">
                                <Edit3Icon className="w-2.5 h-2.5" />
                                Overridden
                              </span>
                            )}
                          </div>
                          {item.details && (
                            <p className="text-xs text-navy-400 mt-0.5">
                              {item.details}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-navy-400 font-mono">
                            {item.id}
                          </span>
                          {canOverride && !item.na && (
                            <span className="text-[10px] text-navy-400">
                              Click to toggle
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4 p-6">
            <h4 className="text-lg font-bold text-navy-900 mb-2">Confirm Override Changes</h4>
            <p className="text-sm text-navy-600 mb-4">
              You are about to override {overrideCount} criteria. This will recalculate the call score from {originalScore} to {manualScore}.
              {manualScore !== originalScore && (
                <span className="block mt-1 font-medium">
                  This represents a {manualScore > originalScore ? "improvement" : "decrease"} of {Math.abs(manualScore - originalScore)} points.
                </span>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={saveOverrides} isLoading={isSaving}>
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Card>
  )
}
