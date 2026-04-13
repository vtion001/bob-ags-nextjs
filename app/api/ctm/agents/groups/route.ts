import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/ctm/agents/groups`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch agent groups', data: [], user_groups: [] },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data.user_groups || [],
      user_groups: data.user_groups || []
    })
  } catch (error) {
    console.error('[ctm/agents/groups] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent groups from CallTrackingMetrics', data: [], user_groups: [] },
      { status: 502 }
    )
  }
}
