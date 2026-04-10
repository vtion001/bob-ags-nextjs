import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'

export default async function proxy(request: NextRequest) {
  // Check for dev bypass session FIRST
  const devSessionCookie = request.cookies.get('sb-dev-session')
  if (devSessionCookie) {
    try {
      const devSession = JSON.parse(devSessionCookie.value)
      if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
        const response = NextResponse.next({ request: { headers: request.headers } })
        response.cookies.set('sb-session', 'dev-session-placeholder', {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        })
        return response
      }
    } catch {
      // Invalid cookie, fall through to normal auth
    }
  }

  // Detect if request is HTTPS (Vercel Edge provides this via headers)
  const isSecure = request.headers.get('x-forwarded-proto') === 'https'
    || request.headers.get('x-url-scheme') === 'https'
    || request.headers.get('referer')?.startsWith('https://')
    || request.headers.get('host')?.includes('vercel.app')

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // Try to get existing session first (may return null without error if expired)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (session) {
    // Valid session - refresh cookies on response
    response.cookies.set('sb-session', session.access_token, cookieOptions)
    if (session.refresh_token) {
      response.cookies.set('sb-refresh-token', session.refresh_token, cookieOptions)
    }
  } else {
    // No session (expired/invalid) - try explicit refresh
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError || !refreshData.session) {
      // Refresh failed - clear stale cookies so browser doesn't retry endlessly
      response.cookies.set('sb-session', '', { ...cookieOptions, maxAge: 0 })
      response.cookies.set('sb-refresh-token', '', { ...cookieOptions, maxAge: 0 })
    } else {
      // Refresh succeeded - set new cookies
      const newSession = refreshData.session!
      response.cookies.set('sb-session', newSession.access_token, cookieOptions)
      if (newSession.refresh_token) {
        response.cookies.set('sb-refresh-token', newSession.refresh_token, cookieOptions)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
