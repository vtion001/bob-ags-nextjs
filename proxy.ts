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
            request.cookies.set(name, value)
          })
        },
      },
    }
  )

  // Refresh session - MUST use getSession() to refresh the session cookie
  // This sets the refresh token cookie via setAll() above
  const { data: { session }, error } = await supabase.auth.getSession()

  let response = NextResponse.next({ request: { headers: request.headers } })

  // If we have a session, apply the session cookies to the response
  if (session) {
    response.cookies.set('sb-session', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
    if (session.refresh_token) {
      response.cookies.set('sb-refresh-token', session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      })
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
