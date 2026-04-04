import { NextRequest, NextResponse } from 'next/server'
import { CTMClient } from '@/lib/ctm/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctmClient = new CTMClient()
    const accountId = ctmClient.getAccountId()

    // Fetch the raw binary audio directly from CTM
    // The /recording endpoint returns raw audio, NOT JSON
    const url = `https://api.calltrackingmetrics.com/api/v1/accounts/${accountId}/calls/${id}/recording`
    const authHeader = `Basic ${Buffer.from(`${ctmClient.accessKey}:${ctmClient.secretKey}`).toString('base64')}`

    const response = await fetch(url, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`CTM API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    // Stream the binary audio back to the client
    const contentType = response.headers.get('Content-Type') || 'audio/mpeg'
    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(audioBuffer.byteLength),
      },
    })
  } catch (error) {
    console.error('Error fetching call audio:', error)
    return NextResponse.json(
      { error: 'Failed to fetch call audio from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
