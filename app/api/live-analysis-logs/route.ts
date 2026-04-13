import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryParams = searchParams.toString()

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/live-analysis-logs${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch live analysis logs' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data.logs || [],
      logs: data.logs || []
    })
  } catch (error) {
    console.error('[live-analysis-logs] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live analysis logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/live-analysis-logs`, {
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
        { error: 'Failed to create live analysis log' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data.log
    })
  } catch (error) {
    console.error('[live-analysis-logs] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to create live analysis log' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/live-analysis-logs`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to delete live analysis logs' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'All logs deleted successfully'
    })
  } catch (error) {
    console.error('[live-analysis-logs] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to delete live analysis logs' },
      { status: 500 }
    )
  }
}
