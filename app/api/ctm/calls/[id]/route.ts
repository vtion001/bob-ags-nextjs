import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/ctm/calls/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      call: data.call
    })
  } catch (error) {
    console.error('[ctm/calls/[id]] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch call from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
