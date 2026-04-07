import { CriterionResult } from './types'

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