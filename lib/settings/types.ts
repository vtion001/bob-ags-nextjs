export interface CTMAssignment {
  userId: string
  email: string
  role: string
  ctmAgentId: string | null
  ctmUserGroupId: string | null
}

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
}

export interface UserPermissions {
  can_view_calls: boolean
  can_view_monitor: boolean
  can_view_history: boolean
  can_view_agents: boolean
  can_manage_settings: boolean
  can_manage_users: boolean
  can_run_analysis: boolean
}

export interface UserRole {
  id: string
  user_id: string
  email: string
  role: 'admin' | 'manager' | 'viewer'
  permissions: UserPermissions
  approved?: boolean
  approved_by?: string
  created_at: string
}

export interface CurrentUser {
  role: string
  permissions: UserPermissions
  email: string
}

export interface CTMAgent {
  id: string
  name: string
  uid: number
}

export interface CTMUserGroup {
  id: string
  name: string
  userIds: number[]
}

export type RoleType = 'admin' | 'manager' | 'viewer'

export const DEFAULT_PERMISSIONS: Record<RoleType, UserPermissions> = {
  admin: {
    can_view_calls: true,
    can_view_monitor: true,
    can_view_history: true,
    can_view_agents: true,
    can_manage_settings: true,
    can_manage_users: true,
    can_run_analysis: true,
  },
  manager: {
    can_view_calls: true,
    can_view_monitor: true,
    can_view_history: true,
    can_view_agents: true,
    can_manage_settings: false,
    can_manage_users: false,
    can_run_analysis: true,
  },
  viewer: {
    can_view_calls: true,
    can_view_monitor: true,
    can_view_history: false,
    can_view_agents: false,
    can_manage_settings: false,
    can_manage_users: false,
    can_run_analysis: false,
  },
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
}
