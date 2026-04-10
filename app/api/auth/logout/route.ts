import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await createServerSupabase(request)
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: 'Failed to logout' },
        { status: 500 }
      )
    }

    // Explicitly clear session cookies to prevent any requests after logout
    // from using old session tokens. This ensures the client-side cookies
    // are invalidated immediately, stopping any polling loops.
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0, // Expire immediately
    }

    response.cookies.set('sb-session', '', cookieOptions)
    response.cookies.set('sb-refresh-token', '', cookieOptions)
    response.cookies.set('sb-dev-session', '', cookieOptions)

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}
