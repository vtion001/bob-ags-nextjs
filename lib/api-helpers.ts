import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'

/**
 * Check if the request is from a dev user (sb-dev-session cookie)
 */
export function isDevUser(request: NextRequest): boolean {
  const devSessionCookie = request.cookies.get('sb-dev-session')
  if (!devSessionCookie) return false
  try {
    const devSession = JSON.parse(devSessionCookie.value)
    if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
      return true
    }
  } catch {}
  return false
}

/**
 * Authenticate request - returns response if unauthorized, null if authorized
 * Use this at the start of any API route handler:
 *
 * export async function GET(request: NextRequest) {
 *   const authError = await authenticate(request)
 *   if (authError) return authError
 *   // ... continue with handler
 * }
 */
export async function authenticate(request: NextRequest): Promise<NextResponse | null> {
  if (isDevUser(request)) {
    return null
  }

  const supabase = await createServerSupabase(request)
  // MUST use getSession() (not getUser()) to refresh the session cookie
  // getUser() only validates the JWT without refreshing, causing getSession() to return null on subsequent API calls
  const { data: { user } } = await supabase.auth.getSession()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return null
}