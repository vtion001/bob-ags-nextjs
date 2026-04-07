import { RubricCriterion } from './types'

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