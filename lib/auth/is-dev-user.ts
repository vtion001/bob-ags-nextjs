import { NextRequest } from 'next/server'

export const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'

/**
 * Check if the request is from a dev user (sb-dev-session cookie)
 * Also checks for sb-session placeholder set by proxy.ts after consuming sb-dev-session
 */
export function isDevUser(request: NextRequest): boolean {
  // Check for original dev session cookie (from proxy)
  const devSessionCookie = request.cookies.get('sb-dev-session')
  if (devSessionCookie) {
    try {
      const devSession = JSON.parse(devSessionCookie.value)
      if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
        return true
      }
    } catch {}
  }

  // Check for placeholder session set by proxy after it consumed sb-dev-session
  const sessionCookie = request.cookies.get('sb-session')
  if (sessionCookie?.value === 'dev-session-placeholder') {
    return true
  }

  return false
}
