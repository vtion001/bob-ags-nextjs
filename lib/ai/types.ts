// Re-export shared types from lib/types for AI module
export type { CriterionResult, RubricBreakdown } from '../types'

// AI-specific types
export interface Analysis {
  qualification_score: number
  sentiment: 'positive' | 'neutral' | 'negative'
  summary: string
  tags: string[]
  suggested_disposition: string
  follow_up_required: boolean
  call_type: string
  detected_state?: string
  detected_insurance?: string
  mentioned_names: string[]
  mentioned_locations: string[]
  salesforce_notes: string
  rubric_results?: CriterionResult[]
  rubric_breakdown?: RubricBreakdown
  ctm_star_rating?: number
}

export interface RubricCriterion {
  id: string
  name: string
  category: string
  severity: 'Minor' | 'Major' | 'ZTP'
  deduction: number
  passPhrases: string[]
  failPhrases: string[]
  ztp: boolean
  autoFail: boolean
  naTriggers?: string[]
}

// Rubric data constants (formerly in rubric.ts)
export const RUBRIC_CRITERIA: RubricCriterion[] = [
  { id: '1.1', name: 'Opening - Used approved greeting', category: 'Opening', severity: 'Minor', deduction: 3, passPhrases: ['hello'], failPhrases: [], ztp: false, autoFail: false },
  { id: '1.2', name: 'Opening - Confirmed caller name', category: 'Opening', severity: 'Minor', deduction: 3, passPhrases: [], failPhrases: [], ztp: false, autoFail: false, naTriggers: ['meeting'] },
  { id: '1.3', name: 'Opening - Identified reason promptly', category: 'Opening', severity: 'Minor', deduction: 3, passPhrases: [], failPhrases: ['assumed'], ztp: false, autoFail: false },
  { id: '1.4', name: 'Opening - Verified caller location', category: 'Opening', severity: 'Minor', deduction: 3, passPhrases: [], failPhrases: [], ztp: false, autoFail: false },
  { id: '2.1', name: 'Probing - Asked about sober/clean time', category: 'Probing', severity: 'Minor', deduction: 3, passPhrases: ['last drink', 'last drug', 'when was'], failPhrases: [], ztp: false, autoFail: false },
  { id: '2.2', name: 'Probing - Inquired about substance', category: 'Probing', severity: 'Minor', deduction: 3, passPhrases: ['substance', 'struggle'], failPhrases: ['advice', 'should'], ztp: false, autoFail: false },
  { id: '2.3', name: 'Probing - Asked about insurance', category: 'Probing', severity: 'Minor', deduction: 3, passPhrases: ['insurance', 'medicaid', 'medicare', 'private'], failPhrases: [], ztp: false, autoFail: false },
  { id: '2.4', name: 'Probing - Gathered additional info', category: 'Probing', severity: 'Minor', deduction: 2, passPhrases: [], failPhrases: [], ztp: false, autoFail: false },
  { id: '2.5', name: 'Probing - Verified caller phone', category: 'Probing', severity: 'Minor', deduction: 2, passPhrases: ['phone', 'number', 'callback'], failPhrases: [], ztp: false, autoFail: false },
  { id: '3.1', name: 'Qualification - Correctly assessed', category: 'Qualification', severity: 'Minor', deduction: 5, passPhrases: [], failPhrases: [], ztp: false, autoFail: false },
  { id: '3.2', name: 'Qualification - Handled caller needs', category: 'Qualification', severity: 'Minor', deduction: 5, passPhrases: [], failPhrases: [], ztp: false, autoFail: false },
  { id: '3.3', name: 'Qualification - Used approved rebuttals', category: 'Qualification', severity: 'Major', deduction: 5, passPhrases: [], failPhrases: [], ztp: false, autoFail: false },
  { id: '3.4', name: 'Qualification - Avoided unqualified transfers', category: 'Qualification', severity: 'ZTP', deduction: 0, passPhrases: [], failPhrases: ['transfer', 'let me transfer', 'someone else'], ztp: true, autoFail: true },
  { id: '3.5', name: 'Qualification - Escalated qualified leads', category: 'Qualification', severity: 'Major', deduction: 5, passPhrases: [], failPhrases: ['delay', 'later'], ztp: false, autoFail: false },
  { id: '3.6', name: 'Qualification - Provided correct referrals', category: 'Qualification', severity: 'Minor', deduction: 3, passPhrases: [], failPhrases: [], ztp: false, autoFail: false },
  { id: '3.7', name: 'Qualification - Maintained empathy', category: 'Qualification', severity: 'Minor', deduction: 3, passPhrases: [], failPhrases: [], ztp: false, autoFail: false },
  { id: '4.1', name: 'Closing - Ended professionally', category: 'Closing', severity: 'Minor', deduction: 3, passPhrases: ['thank you', 'next steps', 'bye'], failPhrases: [], ztp: false, autoFail: false },
  { id: '4.2', name: 'Closing - Documented in Salesforce', category: 'Closing', severity: 'Minor', deduction: 3, passPhrases: [], failPhrases: [], ztp: false, autoFail: false, naTriggers: ['salesforce', 'verify'] },
  { id: '4.3', name: 'Closing - Applied correct star rating', category: 'Closing', severity: 'Minor', deduction: 3, passPhrases: [], failPhrases: [], ztp: false, autoFail: false, naTriggers: ['salesforce', 'verify'] },
  { id: '4.4', name: 'Closing - Noted follow-up requests', category: 'Closing', severity: 'Minor', deduction: 3, passPhrases: [], failPhrases: [], ztp: false, autoFail: false, naTriggers: ['salesforce', 'verify'] },
  { id: '5.1', name: 'Compliance - Upheld HIPAA', category: 'Compliance', severity: 'ZTP', deduction: 0, passPhrases: [], failPhrases: ['confidential', 'privacy', 'hipaa'], ztp: true, autoFail: true },
  { id: '5.2', name: 'Compliance - Avoided medical advice', category: 'Compliance', severity: 'ZTP', deduction: 0, passPhrases: [], failPhrases: ['medical', 'doctor', 'prescription', 'treatment plan'], ztp: true, autoFail: true },
  { id: '5.3', name: 'Compliance - Response time', category: 'Compliance', severity: 'Minor', deduction: 2, passPhrases: [], failPhrases: [], ztp: false, autoFail: false },
  { id: '5.4', name: 'Compliance - Demonstrated soft skills', category: 'Compliance', severity: 'Minor', deduction: 3, passPhrases: [], failPhrases: [], ztp: false, autoFail: false },
  { id: '5.5', name: 'Compliance - Adhered to SOP', category: 'Compliance', severity: 'Minor', deduction: 3, passPhrases: [], failPhrases: [], ztp: false, autoFail: false },
]

export const ALWAYS_NA_CRITERIA = ['4.2', '4.3', '4.4']

// ZTP criteria that auto-fail
export const ZTP_CRITERIA = ['3.4', '5.1', '5.2']

// Category weights for scoring
export const CATEGORY_WEIGHTS = {
  Opening: 15,
  Probing: 20,
  Qualification: 35,
  Closing: 15,
  Compliance: 15,
}