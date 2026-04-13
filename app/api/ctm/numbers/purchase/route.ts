import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone_number, test = true } = body

    if (!phone_number) {
      return NextResponse.json(
        { error: 'phone_number is required' },
        { status: 400 }
      )
    }

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/ctm/numbers/purchase`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ phone_number, test }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to purchase number' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    console.error('[ctm/numbers/purchase] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to purchase number in CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
