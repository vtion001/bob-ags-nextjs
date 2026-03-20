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