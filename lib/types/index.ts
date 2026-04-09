export * from './ctm'

export interface Agent {
  id: string
  name: string
  email: string
  uid?: number
  phone?: string
}

export interface UserGroup {
  id: string
  name: string
  userIds: number[]
}

export interface Call {
  id: string
  phone: string
  direction: 'inbound' | 'outbound'
  duration: number
  status: 'completed' | 'missed' | 'active' | 'voicemail'
  timestamp: Date
  name?: string
  callerNumber?: string
  trackingNumber?: string
  trackingLabel?: string
  source?: string
  sourceId?: string
  accountId?: string
  agent?: Agent
  recordingUrl?: string
  transcript?: string
  city?: string
  state?: string
  postalCode?: string
  notes?: string
  talkTime?: number
  waitTime?: number
  ringTime?: number
  score?: number
  starRating?: number
  tags?: string[]
  analysis?: CallAnalysis
  destinationNumber?: string
  poolNumber?: string
  didNumber?: string
  trackingNumberFormat?: string
}

export interface CallAnalysis {
  score: number
  sentiment: string
  summary: string
  tags: string[]
  disposition: string
  follow_up_required?: boolean
  call_type?: string
  detected_state?: string
  detected_insurance?: string
  mentioned_names?: string[]
  mentioned_locations?: string[]
  salesforce_notes?: string
  rubric_results?: CriterionResult[]
  rubric_breakdown?: RubricBreakdown
}

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
  na?: boolean
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

export interface GetCallsParams {
  limit?: number
  hours?: number
  status?: string | null
  sourceId?: string | null
  agentId?: string | null
  page?: number
}

export interface SearchNumbersParams {
  country?: string
  searchby?: 'area' | 'address' | 'zip'
  areacode?: string
  address?: string
  pattern?: string
}

export interface DashboardStats {
  totalCalls: number
  analyzed: number
  hotLeads: number
  avgScore: string
}

export interface Session {
  user: {
    id: string
    email: string
    name?: string
  }
  expiresAt: number
}