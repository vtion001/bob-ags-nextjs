import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/calls/bulk-analyze`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to get analysis status' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      unanalyzedCount: data.unanalyzedCount || 0,
      analyzedCount: data.analyzedCount || 0
    })
  } catch (error) {
    console.error('[calls/bulk-analyze] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to get analysis status' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/calls/bulk-analyze`, {
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
        { error: 'Failed to bulk analyze calls' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      processed: data.processed || 0,
      successCount: data.successCount || 0,
      failCount: data.failCount || 0,
      results: data.results || []
    })
  } catch (error) {
    console.error('[calls/bulk-analyze] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to bulk analyze calls' },
      { status: 500 }
    )
  }
}
