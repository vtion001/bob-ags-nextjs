import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/users/ctm-assignments`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        assignments: []
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      assignments: data.assignments || []
    })
  } catch (error) {
    console.error('[ctm-assignments] Proxy error:', error)
    return NextResponse.json({
      success: true,
      assignments: []
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/users/ctm-assignments`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to update CTM assignments' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true,
      assignments: data.assignments || []
    })
  } catch (error) {
    console.error('[ctm-assignments] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to update CTM assignments' },
      { status: 500 }
    )
  }
}
