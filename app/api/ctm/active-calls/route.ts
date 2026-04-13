import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/ctm/active-calls`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    // Graceful degradation - return empty array on CTM failures
    if (!response.ok) {
      return NextResponse.json({
        success: true,
        calls: []
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      calls: data.calls || []
    })
  } catch (error) {
    console.error('[ctm/active-calls] Proxy error:', error)
    return NextResponse.json({
      success: true,
      calls: []
    })
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch active calls.' },
    { status: 405 }
  )
}
