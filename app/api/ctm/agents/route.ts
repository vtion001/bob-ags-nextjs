import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/ctm/agents`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch agents', data: [], agents: [] },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data.agents || [],
      agents: data.agents || []
    })
  } catch (error) {
    console.error('[ctm/agents] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents from CallTrackingMetrics', data: [], agents: [] },
      { status: 502 }
    )
  }
}
