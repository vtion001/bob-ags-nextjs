export interface CriterionResult {
  id: string
  criterion: string
  pass: boolean
  ztp: boolean
  autoFail: boolean
  details: string
  deduction: number
  severity: string
  category: string
}

export interface RubricBreakdown {
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
}