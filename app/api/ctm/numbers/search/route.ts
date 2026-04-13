import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryParams = searchParams.toString()

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/ctm/numbers/search${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to search numbers' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    console.error('[ctm/numbers/search] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to search numbers in CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
