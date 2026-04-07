// Re-export from types/ for backward compatibility
export * from './types'

// Legacy re-exports from the old monolithic file
// These will be removed after all imports are updated
import type {
  CTMAssignment,
  UserSettings,
  UserPermissions,
  UserRole,
  CurrentUser,
  CTMAgent,
  CTMUserGroup,
  RoleType,
} from './types/permissions'
import { DEFAULT_PERMISSIONS } from './types/permissions'
import { DEFAULT_SETTINGS } from './types/credentials'

export type {
  CTMAssignment,
  UserSettings,
  UserPermissions,
  UserRole,
  CurrentUser,
  CTMAgent,
  CTMUserGroup,
  RoleType,
}

export { DEFAULT_PERMISSIONS, DEFAULT_SETTINGS }