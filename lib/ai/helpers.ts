// Backward compatibility re-export
// lib/ai/helpers.ts has been split into focused modules

// Legacy imports for internal use
import { extractNames, extractLocations, detectInsurance, detectCallType } from './extraction'
import { keywordMatch, generateDetails } from './keyword-matching'
import { evaluateRubric, calculateBreakdown, calculateScore } from './scoring'
import { generateTags, generateSummary, getDisposition, generateSalesforceNotes } from './generation'

// Re-export for convenience
export {
  extractNames,
  extractLocations,
  detectInsurance,
  detectCallType,
  keywordMatch,
  generateDetails,
  evaluateRubric,
  calculateBreakdown,
  calculateScore,
  generateTags,
  generateSummary,
  getDisposition,
  generateSalesforceNotes,
}