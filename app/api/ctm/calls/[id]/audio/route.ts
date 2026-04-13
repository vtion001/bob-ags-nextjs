import { NextRequest, NextResponse } from 'next/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_LARAVEL_API_URL || 'http://localhost:8000'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Proxy to Laravel API
    const response = await fetch(`${LARAVEL_API_URL}/api/ctm/calls/${id}/audio`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'No recording available for this call' },
        { status: response.status }
      )
    }

    // Return the audio stream
    const audioBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('Content-Type') || 'audio/mpeg'

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(audioBuffer.byteLength),
      },
    })
  } catch (error) {
    console.error('[ctm/calls/[id]/audio] Proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch call audio from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
