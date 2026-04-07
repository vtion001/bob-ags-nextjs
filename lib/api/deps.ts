// Backward compatibility re-export
// lib/api/deps.ts has been split into focused modules

export type { AuthenticatedUser } from './auth'
export { getAuthenticatedUser, requireAdmin, getUserSettings } from './auth'

export { createErrorResponse } from './response'

export { getCTMClient, fetchAllCTMData } from './ctm'
