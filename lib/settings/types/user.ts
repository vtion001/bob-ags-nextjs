import { UserPermissions, RoleType } from './permissions'

export interface UserRole {
  id: string
  user_id: string
  email: string
  role: RoleType
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