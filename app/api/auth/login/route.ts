import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase(request)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return NextResponse.json(
        { error: error.message || 'Login failed' },
        { status: 401 }
      )
    }

    // Set auth cookies on response (Supabase client doesn't do this automatically for signInWithPassword)
    const response = NextResponse.json({
      success: true,
      user: data.user,
      session: data.session
    })

    if (data.session) {
      const isSecure = request.headers.get('x-forwarded-proto') === 'https'
        || request.headers.get('x-url-scheme') === 'https'
        || request.headers.get('referer')?.startsWith('https://')
        || request.headers.get('host')?.includes('vercel.app')

      const cookieOptions = {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      }

      response.cookies.set('sb-session', data.session.access_token, cookieOptions)
      if (data.session.refresh_token) {
        response.cookies.set('sb-refresh-token', data.session.refresh_token, cookieOptions)
      }
    }

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
