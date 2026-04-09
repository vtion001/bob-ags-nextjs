import { CriterionResult, RubricBreakdown } from '@/lib/types'
import { RUBRIC_CRITERIA, ALWAYS_NA_CRITERIA } from './rubric'
import { keywordMatch, generateDetails } from './keyword-matching'

export function evaluateRubric(
  lower: string,
  aiResults: Record<string, { pass: boolean; details: string }>
): CriterionResult[] {
  return RUBRIC_CRITERIA.map(criterion => {
    if (ALWAYS_NA_CRITERIA.includes(criterion.id)) {
      return {
        id: criterion.id,
        criterion: criterion.name,
        pass: true,
        na: true,
        ztp: criterion.ztp,
        autoFail: criterion.autoFail,
        details: 'N/A - Requires manual Salesforce verification',
        deduction: 0,
        severity: criterion.severity,
        category: criterion.category,
      }
    }

    const aiResult = aiResults[criterion.id]
    const pass = aiResult ? aiResult.pass : keywordMatch(lower, criterion)
    const details = aiResult?.details || generateDetails(lower, criterion)
    return {
      id: criterion.id,
      criterion: criterion.name,
      pass,
      ztp: criterion.ztp,
      autoFail: criterion.autoFail,
      details,
      deduction: pass ? 0 : criterion.deduction,
      severity: criterion.severity,
      category: criterion.category,
    }
  })
}

export function calculateBreakdown(results: CriterionResult[]) {
  const breakdown: RubricBreakdown = {
    opening_score: 0, opening_max: 0,
    probing_score: 0, probing_max: 0,
    qualification_score_detail: 0, qualification_max: 0,
    closing_score: 0, closing_max: 0,
    compliance_score: 0, compliance_max: 0
  }
  let ztpFailures = 0
  let autoFailed = false

  for (const r of results) {
    if (r.na) {
      continue
    }
    const points = r.ztp ? 10 : r.severity === 'Minor' ? 2 : r.severity === 'Major' ? 5 : 0
    const key = r.category === 'Opening' ? 'opening' :
                 r.category === 'Probing' ? 'probing' :
                 r.category === 'Qualification' ? 'qualification' :
                 r.category === 'Closing' ? 'closing' : 'compliance'
    const scoreKey = `${key}_score` as keyof RubricBreakdown
    const maxKey = `${key}_max` as keyof RubricBreakdown
    breakdown[maxKey] += points
    if (r.pass) breakdown[scoreKey] += points
    if (r.ztp && !r.pass) ztpFailures++
    if (r.autoFail && !r.pass) autoFailed = true
  }

  return { breakdown, ztpFailures, autoFailed }
}

export function calculateScore(
  breakdown: RubricBreakdown,
  ztpFailures: number,
  autoFailed: boolean
): number {
  if (autoFailed || ztpFailures >= 2) return 0
  const totalMax = breakdown.opening_max + breakdown.probing_max + breakdown.qualification_max + breakdown.closing_max + breakdown.compliance_max
  const totalScore = breakdown.opening_score + breakdown.probing_score + breakdown.qualification_score_detail + breakdown.closing_score + breakdown.compliance_score
  if (totalMax === 0) return 50
  return Math.round((totalScore / totalMax) * 100)
}