import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const queryParams = searchParams.toString()

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/calls${queryParams ? `?${queryParams}` : ''}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch calls' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      calls: data.calls || []
    })
  } catch (error) {
    console.error('[calls] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calls' },
      { status: 502 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/calls`, {
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
        { error: 'Failed to store calls' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('[calls] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to store calls' },
      { status: 500 }
    )
  }
}
