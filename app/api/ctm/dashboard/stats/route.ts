import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryParams = searchParams.toString()

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/ctm/dashboard/stats${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch dashboard stats' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      stats: data.stats || {
        totalCalls: 0,
        answered: 0,
        missed: 0,
        avgDuration: 0,
        avgScore: 0,
      }
    })
  } catch (error) {
    console.error('[ctm/dashboard/stats] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
