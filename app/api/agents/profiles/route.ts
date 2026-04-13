import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/agents/profiles`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch agent profiles' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      agents: data.profiles || []
    })
  } catch (error) {
    console.error('[agents/profiles] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agent profiles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/agents/profiles`, {
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
        { error: 'Failed to create agent profile' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      agent: data.profile
    })
  } catch (error) {
    console.error('[agents/profiles] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to create agent profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/agents/profiles/${body.id}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update agent profile' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      agent: data.profile
    })
  } catch (error) {
    console.error('[agents/profiles] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to update agent profile' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Agent profile ID is required' },
        { status: 400 }
      )
    }

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/agents/profiles/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to delete agent profile' },
        { status: response.status }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('[agents/profiles] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent profile' },
      { status: 500 }
    )
  }
}
