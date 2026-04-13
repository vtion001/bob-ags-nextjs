import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/ctm/calls/bulk-sync`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to perform bulk sync' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      synced: data.synced || 0,
      message: data.message || 'Bulk sync completed'
    })
  } catch (error) {
    console.error('[ctm/calls/bulk-sync] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk sync' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/ctm/calls/bulk-sync`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to perform bulk sync' },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      synced: data.synced || 0,
      message: data.message || 'Bulk sync completed'
    })
  } catch (error) {
    console.error('[ctm/calls/bulk-sync] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk sync' },
      { status: 500 }
    )
  }
}
