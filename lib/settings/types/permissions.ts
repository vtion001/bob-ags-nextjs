export type RoleType = 'admin' | 'manager' | 'viewer' | 'qa' | 'agent'

export interface UserPermissions {
  can_view_calls: boolean
  can_view_monitor: boolean
  can_view_history: boolean
  can_view_agents: boolean
  can_manage_settings: boolean
  can_manage_users: boolean
  can_run_analysis: boolean
}

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
  qa: {
    can_view_calls: true,
    can_view_monitor: true,
    can_view_history: true,
    can_view_agents: true,
    can_manage_settings: false,
    can_manage_users: false,
    can_run_analysis: true,
  },
  agent: {
    can_view_calls: false,
    can_view_monitor: true,
    can_view_history: false,
    can_view_agents: false,
    can_manage_settings: false,
    can_manage_users: false,
    can_run_analysis: false,
  },
}