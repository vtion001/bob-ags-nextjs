import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { CTMClient } from '@/lib/ctm'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const ctmClient = new CTMClient()
    
    const call = await ctmClient.getCall(id)
    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    if (!call.recordingUrl) {
      return NextResponse.json({ error: 'No recording available for this call' }, { status: 404 })
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY
    if (!openrouterKey) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 })
    }

    const audioResponse = await fetch(call.recordingUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(process.env.CTM_ACCESS_KEY + ':' + process.env.CTM_SECRET_KEY).toString('base64')}`,
      },
    })

    if (!audioResponse.ok) {
      return NextResponse.json({ error: 'Failed to download audio recording' }, { status: 500 })
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    const base64Audio = Buffer.from(audioBuffer).toString('base64')
    const mimeType = audioResponse.headers.get('content-type') || 'audio/mpeg'

    const transcriptResponse = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/whisper-large-v3',
        audio: `data:${mimeType};base64,${base64Audio}`,
        response_format: 'json',
      }),
    })

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text()
      console.error('OpenRouter transcription error:', errorText)
      return NextResponse.json({ error: 'Failed to transcribe audio' }, { status: 500 })
    }

    const result = await transcriptResponse.json()
    const transcript = result.text || ''

    return NextResponse.json({ 
      transcript,
      audioUrl: call.recordingUrl,
      duration: call.duration,
      callId: id,
    })
  } catch (error) {
    console.error('CTM transcript error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transcript' },
      { status: 500 }
    )
  }
}