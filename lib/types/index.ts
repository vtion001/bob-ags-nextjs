export interface CTMCall {
  id: number
  sid?: string
  account_id?: number
  name?: string
  caller_id?: string
  caller_number?: string
  phone_number?: string
  duration?: number
  status?: string
  direction?: string
  started_at?: string
  called_at?: string
  source?: string
  source_id?: string
  source_sid?: string
  tracking_number?: string
  tracking_number_format?: string
  tracking_label?: string
  talk_time?: number
  wait_time?: number
  ring_time?: number
  destination_number?: string
  pool_number?: string
  did_number?: string
  recording_url?: string
  audio?: string
  transcript?: string
  city?: string
  state?: string
  postal_code?: string
  notes?: string
  tag_list?: string[]
  emails?: Array<{ email: string }>
  agent?: {
    id: string
    name: string
    email: string
  }
  agent_id?: string
}

export interface CTMAgent {
  id: string
  uid: number
  name?: string
  email?: string
}

export interface CTMUserGroup {
  id: number
  name?: string
  user_ids?: number[]
}

export interface Call {
  id: string
  phone: string
  direction: 'inbound' | 'outbound'
  duration: number
  status: 'completed' | 'missed' | 'active'
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

export interface Agent {
  id: string
  name: string
  email: string
  uid?: number
}

export interface CTMAccount {
  id: number
  name: string
  status?: string
  created_at?: string
}

export interface CTMNumber {
  id: number
  source: number
  friendly_name: string
  number: string
  phone_number: string
  latitude?: string
  longitude?: string
  region?: string
  postal_code?: string
  iso_country?: string
  ratecenter?: string
  capabilities?: {
    voice: boolean
    SMS: boolean
    MMS: boolean
  }
  number_type?: string
  distance?: number
}

export interface CTMSource {
  id: string
  name: string
  account_id: number
  referring_url?: string
  landing_url?: string
  position?: number
  online?: boolean
  geo_mode?: string
}

export interface CTMSchedule {
  id: number
  name: string
  times?: ScheduleTime[]
  timezone?: string
}

export interface ScheduleTime {
  start_time: string
  end_time: string
  days: Record<string, boolean>
  position: string
}

export interface CTMVoiceMenu {
  id: number
  name: string
  play_message?: string
  input_maxkeys?: string
  input_timeout?: string
  prompt_retries?: string
  items?: VoiceMenuItem[]
}

export interface VoiceMenuItem {
  keypress: string
  voice_action_type: string
  dial_number_id?: string
  next_voice_menu_id?: string
}

export interface CTMReceivingNumber {
  id: number
  number: string
  name?: string
  account_id?: number
  created_at?: string
}

export interface UserGroup {
  id: string
  name: string
  userIds: number[]
}

export interface GetCallsParams {
  limit?: number
  hours?: number
  status?: string | null
  sourceId?: string | null
  agentId?: string | null
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
