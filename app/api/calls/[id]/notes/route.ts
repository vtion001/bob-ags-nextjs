import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const callId = searchParams.get('callId') || id

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/calls/${callId}/notes`, {
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
        notes: []
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      notes: data.notes || []
    })
  } catch (error) {
    console.error('[calls/[id]/notes] Proxy error:', error)
    return NextResponse.json({
      success: true,
      notes: []
    })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { callId, notes } = body || {}

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/calls/${callId || id}/notes`, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ notes }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update notes' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      notes: data.notes
    })
  } catch (error) {
    console.error('[calls/[id]/notes] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to update notes' },
      { status: 500 }
    )
  }
}
