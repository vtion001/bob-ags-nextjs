import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({
      success: true,
      message: data.message || 'Logged out successfully'
    })
  } catch (error) {
    console.error('[logout] Proxy error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}
