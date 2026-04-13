export interface UserSettings {
  ctm_access_key: string
  ctm_secret_key: string
  ctm_account_id: string
  openrouter_api_key: string
  default_client: string
  light_mode: boolean
  email_notifications: boolean
  auto_sync_calls: boolean
  call_sync_interval: number
  // Laravel settings fields
  ctm_agent_id?: string | null
  theme?: string
  notifications_enabled?: boolean
}

export const DEFAULT_SETTINGS: UserSettings = {
  ctm_access_key: '',
  ctm_secret_key: '',
  ctm_account_id: '',
  openrouter_api_key: '',
  default_client: 'flyland',
  light_mode: true,
  email_notifications: false,
  auto_sync_calls: true,
  call_sync_interval: 60,
  ctm_agent_id: null,
  theme: 'dark',
  notifications_enabled: true,
}