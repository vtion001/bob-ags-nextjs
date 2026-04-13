import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/qa-overrides`, {
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
        qa_overrides: []
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      qa_overrides: data.qa_overrides || []
    })
  } catch (error) {
    console.error('[qa-override] Proxy error:', error)
    return NextResponse.json({
      success: true,
      qa_overrides: []
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/qa-overrides`, {
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
        { error: 'Failed to create QA override' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      qa_override: data.qa_override
    })
  } catch (error) {
    console.error('[qa-override] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to create QA override' },
      { status: 500 }
    )
  }
}
