import { NextRequest, NextResponse } from 'next/server'
import { CTMClient } from '@/lib/ctm/client'
import { authenticate } from '@/lib/api-helpers'
import type { CTMCall } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const { id } = await params
    const ctmClient = new CTMClient()
    const accountId = ctmClient.getAccountId()
    const authHeader = ctmClient.getBasicAuthHeader()

    // First, get the call details to retrieve the SID and recording URL
    // CTM API requires numeric ID for /calls/{id}.json but the recording URL uses SID
    const callUrl = `https://api.calltrackingmetrics.com/api/v1/accounts/${accountId}/calls/${id}.json`

    const callResponse = await fetch(callUrl, {
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    })

    if (!callResponse.ok) {
      const errorText = await callResponse.text()
      throw new Error(`CTM API error: ${callResponse.status} ${callResponse.statusText} - ${errorText}`)
    }

    const callData = await callResponse.json() as CTMCall

    // The recording URL uses the SID, not numeric ID
    // CTM returns audio field with URL like: https://app.calltrackingmetrics.com/api/v1/accounts/{accountId}/calls/{sid}/recording
    const recordingUrl = callData.audio || callData.recording_url

    if (!recordingUrl) {
      return NextResponse.json(
        { error: 'No recording available for this call' },
        { status: 404 }
      )
    }

    // Fetch the actual audio from the recording URL using CTM auth
    let audioResponse: Response
    try {
      audioResponse = await fetch(recordingUrl, {
        headers: { 'Authorization': `Basic ${authHeader}` },
        redirect: 'follow',
      })
    } catch (fetchError) {
      throw new Error(`Failed to fetch audio from recording URL: ${recordingUrl}`)
    }

    // Handle redirect if present (e.g., S3 URL)
    if (audioResponse.status === 303 || audioResponse.status === 302) {
      const redirectUrl = audioResponse.headers.get('Location')
      if (redirectUrl) {
        try {
          const s3Response = await fetch(redirectUrl)
          if (!s3Response.ok) {
            throw new Error(`S3 error: ${s3Response.status}`)
          }
          const audioBuffer = await s3Response.arrayBuffer()
          const contentType = s3Response.headers.get('Content-Type') || 'audio/mpeg'
          return new NextResponse(audioBuffer, {
            headers: {
              'Content-Type': contentType,
              'Content-Length': String(audioBuffer.byteLength),
            },
          })
        } catch (s3Error) {
          throw new Error(`Failed to fetch audio from redirect URL: ${s3Error}`)
        }
      }
    }

    if (!audioResponse.ok) {
      throw new Error(`Audio fetch error: ${audioResponse.status}`)
    }

    // Stream the binary audio back to the client
    const contentType = audioResponse.headers.get('Content-Type') || 'audio/mpeg'
    const audioBuffer = await audioResponse.arrayBuffer()

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(audioBuffer.byteLength),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch call audio from CallTrackingMetrics', details: message },
      { status: 502 }
    )
  }
}
