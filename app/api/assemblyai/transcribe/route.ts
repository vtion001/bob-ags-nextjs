import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'

function isDevUser(request: NextRequest): boolean {
  const devSessionCookie = request.cookies.get('sb-dev-session')
  if (devSessionCookie) {
    try {
      const devSession = JSON.parse(devSessionCookie.value)
      if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
        return true
      }
    } catch {}
  }
  const sessionCookie = request.cookies.get('sb-session')
  if (sessionCookie?.value === 'dev-session-placeholder') {
    return true
  }
  return false
}

async function getCTMAudioProxyUrl(callId: string): Promise<string | null> {
  // Use our own proxy endpoint for audio - this avoids CORS and signed URL issues
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/api/ctm/calls/${callId}/audio`
}

export async function POST(request: NextRequest) {
  try {
    if (!isDevUser(request)) {
      const { supabase } = await createServerSupabase(request)
      // MUST use getSession() to refresh cookies
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { audioUrl, callId } = body

    if (!callId) {
      return NextResponse.json({ error: 'callId is required' }, { status: 400 })
    }

    const apiKey = process.env.ASSEMBLYAI_API_KEY || process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'AssemblyAI API key not configured' }, { status: 500 })
    }

    // Get CTM auth header for proxying audio requests
    const ctmAccessKey = process.env.CTM_ACCESS_KEY
    const ctmSecretKey = process.env.CTM_SECRET_KEY
    const ctmAccountId = process.env.CTM_ACCOUNT_ID

    if (!ctmAccessKey || !ctmSecretKey) {
      return NextResponse.json({ error: 'CTM credentials not configured' }, { status: 500 })
    }

    const ctmAuth = Buffer.from(`${ctmAccessKey}:${ctmSecretKey}`).toString('base64')

    // First, get the call details to find the audio URL
    const callUrl = `https://api.calltrackingmetrics.com/api/v1/accounts/${ctmAccountId}/calls/${callId}.json`
    const callResponse = await fetch(callUrl, {
      headers: { 'Authorization': `Basic ${ctmAuth}` },
    })

    if (!callResponse.ok) {
      return NextResponse.json({ error: 'Failed to get call details from CTM' }, { status: 502 })
    }

    const callData = await callResponse.json()
    const recordingUrl = callData.audio || callData.recording_url

    if (!recordingUrl) {
      return NextResponse.json({ error: 'No recording available for this call' }, { status: 404 })
    }

    // Fetch the audio from CTM (with auth) and pipe to AssemblyAI
    // This avoids the signed URL expiration issue
    const audioResponse = await fetch(recordingUrl, {
      headers: { 'Authorization': `Basic ${ctmAuth}` },
      redirect: 'follow',
    })

    if (!audioResponse.ok) {
      return NextResponse.json({ error: `Failed to fetch audio: ${audioResponse.status}` }, { status: 502 })
    }

    const audioBuffer = await audioResponse.arrayBuffer()

    // Upload audio to AssemblyAI
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: audioBuffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      return NextResponse.json({ error: `AssemblyAI upload failed: ${errorText}` }, { status: 502 })
    }

    const { upload_url } = await uploadResponse.json()

    // Submit for transcription
    const submitResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: upload_url,
        speech_models: ['universal-2'],
        punctuate: true,
        format_text: true,
      }),
    })

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text()
      return NextResponse.json({ error: `AssemblyAI transcription failed: ${errorText}` }, { status: 502 })
    }

    const submitData = await submitResponse.json()
    const transcriptId = submitData.id

    // Poll for completion
    const maxAttempts = 60
    let attempts = 0

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000))

      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': apiKey,
        },
      })

      if (!statusResponse.ok) {
        attempts++
        continue
      }

      const statusData = await statusResponse.json()

      if (statusData.status === 'completed') {
        return NextResponse.json({
          success: true,
          transcript: statusData.text || '',
          id: transcriptId,
        })
      } else if (statusData.status === 'error') {
        return NextResponse.json({
          error: `Transcription error: ${statusData.error}`,
        }, { status: 502 })
      }

      attempts++
    }

    return NextResponse.json({
      error: 'Transcription timed out',
    }, { status: 504 })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}