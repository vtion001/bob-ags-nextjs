import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/ctm/receiving_numbers`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch receiving numbers' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    console.error('[ctm/receiving_numbers] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receiving numbers from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/ctm/receiving_numbers`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to create receiving number' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    console.error('[ctm/receiving_numbers] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to create receiving number in CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
