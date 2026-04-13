import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/logout`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Logout failed' },
        { status: response.status }
      )
    }

    // Clear any leftover Supabase cookies for cleanliness
    const nextResponse = NextResponse.json({
      success: true,
      message: data.message || 'Logged out successfully'
    })

    nextResponse.cookies.set('sb-session', '', { maxAge: 0, path: '/' })
    nextResponse.cookies.set('sb-refresh-token', '', { maxAge: 0, path: '/' })
    nextResponse.cookies.set('sb-dev-session', '', { maxAge: 0, path: '/' })

    return nextResponse
  } catch (error) {
    console.error('[logout] Proxy error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}
