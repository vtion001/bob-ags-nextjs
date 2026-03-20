import { CriterionResult, RubricBreakdown, RubricCriterion } from './types'
import { RUBRIC_CRITERIA } from './rubric'

const US_STATES = [
  'alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware',
  'florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky',
  'louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi',
  'missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico',
  'new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania',
  'rhode island','south carolina','south dakota','tennessee','texas','utah','vermont',
  'virginia','washington','west virginia','wisconsin','wyoming'
]

export function extractNames(transcript: string): string[] {
  const names: string[] = []
  const namePattern = /(?:my name is|I'm|this is|name's)\s+([A-Z][a-z]+)/gi
  let match
  while ((match = namePattern.exec(transcript)) !== null) names.push(match[1])
  return [...new Set(names)]
}

export function extractLocations(transcript: string): string[] {
  const locations: string[] = []
  const lower = transcript.toLowerCase()
  for (const state of US_STATES) {
    if (lower.includes(state)) locations.push(state.charAt(0).toUpperCase() + state.slice(1))
  }
  return [...new Set(locations)]
}

export function detectInsurance(transcript: string): string {
  const lower = transcript.toLowerCase()
  if (lower.includes('medicaid')) return 'medicaid'
  if (lower.includes('medicare')) return 'medicare'
  if (lower.includes('tricare')) return 'tricare'
  if (lower.includes('kaiser')) return 'kaiser'
  if (lower.includes('private') || lower.includes('blue cross') || lower.includes('aetna') || lower.includes('cigna') || lower.includes('united')) return 'private'
  if (lower.includes('self pay') || lower.includes('self-pay')) return 'self-pay'
  return ''
}

export function detectCallType(transcript: string): string {
  const lower = transcript.toLowerCase()
  if (lower.includes('al-anon') || lower.includes('family')) return 'al-anon'
  if (lower.includes('facility') || lower.includes('treatment center')) return 'facility'
  if (lower.includes('looking for help') || lower.includes('addiction')) return 'treatment'
  return 'general'
}

export function keywordMatch(lower: string, criterion: RubricCriterion): boolean {
  const passCount = criterion.passPhrases.filter(p => lower.includes(p.toLowerCase())).length
  const failCount = criterion.failPhrases.filter(p => lower.includes(p.toLowerCase())).length
  if (criterion.ztp || criterion.autoFail) return failCount === 0
  return passCount > failCount
}

export function generateDetails(lower: string, criterion: RubricCriterion): string {
  const found = criterion.passPhrases.find(p => lower.includes(p.toLowerCase()))
  if (found) return `Detected: "${found}"`
  const missed = criterion.failPhrases.find(p => lower.includes(p.toLowerCase()))
  if (missed) return `Issue detected: "${missed}"`
  return criterion.ztp || criterion.autoFail ? 'No violations detected' : 'Not clearly detected in transcript'
}

export function evaluateRubric(
  lower: string,
  aiResults: Record<string, { pass: boolean; details: string }>
): CriterionResult[] {
  return RUBRIC_CRITERIA.map(criterion => {
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

export function generateTags(
  results: CriterionResult[],
  score: number,
  insurance: string,
  state: string
): string[] {
  const tags: string[] = []
  if (score >= 85) tags.push('excellent')
  else if (score >= 70) tags.push('good')
  else if (score >= 50) tags.push('needs-improvement')
  else tags.push('poor')
  const failed = results.filter(r => !r.pass)
  const categories = [...new Set(failed.map(r => r.category))]
  for (const cat of categories) tags.push(`${cat.toLowerCase()}-gap`)
  if (results.find(r => r.id === '3.4' && !r.pass)) tags.push('unqualified-transfer')
  if (results.find(r => r.id === '5.1' && !r.pass)) tags.push('hipaa-risk')
  if (results.find(r => r.id === '5.2' && !r.pass)) tags.push('medical-advice-risk')
  const ztpFails = results.filter(r => !r.pass && r.ztp)
  if (ztpFails.length > 0) tags.push('ztp-violation')
  if (insurance) tags.push(`insurance:${insurance}`)
  if (state) tags.push(`state:${state}`)
  return [...new Set(tags)]
}

export function generateSummary(
  results: CriterionResult[],
  score: number,
  autoFailed: boolean
): string {
  if (autoFailed) return 'Auto-failed due to critical compliance violation (ZTP). Call requires immediate supervisor review.'
  const failed = results.filter(r => !r.pass)
  const categories = [...new Set(failed.map(r => r.category))]
  if (categories.length === 0) return 'Excellent call. Agent followed all quality standards across all categories.'
  const worst = failed.filter(r => r.severity === 'Major' || r.severity === 'ZTP')
  const categorySummary = categories.map(c => {
    const catFails = failed.filter(r => r.category === c)
    return `${c} (${catFails.length} issue${catFails.length > 1 ? 's' : ''})`
  }).join(', ')
  if (worst.length > 0) return `Call scored ${score}/100. Major issues in: ${categorySummary}. Requires coaching on critical criteria.`
  return `Call scored ${score}/100. Minor issues in: ${categorySummary}. Generally good performance with room for refinement.`
}

export function getDisposition(
  results: CriterionResult[],
  score: number,
  autoFailed: boolean
): string {
  if (autoFailed) return 'Auto-fail: Critical violation - Requires supervisor review'
  const qualify3 = results.find(r => r.id === '3.4')
  if (qualify3 && !qualify3.pass) return 'Unqualified - Do not transfer (state insurance/self-pay/out-of-state/VA/Kaiser)'
  if (score >= 80) return 'Qualified Lead - Transfer to treatment facility (tag: Qualified Transfer, 4 stars)'
  if (score >= 60) return 'Warm Lead - Provide resources and schedule callback (3 stars)'
  if (score >= 40) return 'Refer - Provide SAMHSA/988 and general resources (2 stars)'
  return 'Do Not Refer - Outside scope or not interested (1 star)'
}

export function generateSalesforceNotes(
  results: CriterionResult[],
  score: number,
  autoFailed: boolean,
  names: string[]
): string {
  const passed = results.filter(r => r.pass)
  const failed = results.filter(r => !r.pass)
  const ztpFailed = failed.filter(r => r.ztp)
  let notes = `QA Score: ${score}/100 | ${passed.length}/25 criteria passed | ${failed.length} failed`
  if (autoFailed) notes += ' | STATUS: AUTO-FAIL - Critical violation detected'
  if (ztpFailed.length > 0) notes += ` | ZTP Violations: ${ztpFailed.length}`
  if (names.length > 0) notes += ` | Caller: ${names[0]}`
  const majorFails = failed.filter(r => r.severity === 'Major' || r.severity === 'ZTP')
  if (majorFails.length > 0) notes += ` | Critical: ${majorFails.map(r => r.id).join(', ')}`
  return notes
}