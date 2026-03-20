import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CTMClient } from '@/lib/ctm'

async function transcribeWithAssemblyAI(audioUrl: string, auth: string): Promise<string> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY
  if (!apiKey) {
    throw new Error('AssemblyAI API key not configured')
  }

  const transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      audio_url: audioUrl,
    }),
  })

  if (!transcriptResponse.ok) {
    const err = await transcriptResponse.text()
    throw new Error(`AssemblyAI error: ${err}`)
  }

  const transcriptJob = await transcriptResponse.json()
  
  // Poll for completion
  let result
  while (true) {
    const pollingRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptJob.id}`, {
      headers: { 'Authorization': apiKey }
    })
    result = await pollingRes.json()
    
    if (result.status === 'completed') break
    if (result.status === 'error') {
      throw new Error(`AssemblyAI transcription failed: ${result.error}`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return result.text || ''
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const ctmClient = new CTMClient()
    
    const call = await ctmClient.calls.getCall(id)
    if (!call) {
      return NextResponse.json({ error: 'Call not found', callId: id }, { status: 404 })
    }

    if (!call.recordingUrl) {
      return NextResponse.json({ 
        transcript: null, 
        error: 'No recording available for this call',
        callId: id 
      })
    }

    console.log('Transcribing audio for call:', id)
    console.log('Audio URL:', call.recordingUrl)

    // Try AssemblyAI first
    if (process.env.ASSEMBLYAI_API_KEY) {
      try {
        const auth = Buffer.from(process.env.CTM_ACCESS_KEY + ':' + process.env.CTM_SECRET_KEY).toString('base64')
        const transcript = await transcribeWithAssemblyAI(call.recordingUrl, auth)
        console.log('Transcription complete, length:', transcript.length)
        return NextResponse.json({ 
          transcript,
          audioUrl: call.recordingUrl,
          duration: call.duration,
          callId: id,
        })
      } catch (assemblyErr) {
        console.error('AssemblyAI failed:', assemblyErr)
      }
    }

    // Fallback: try using the CTM transcript if available
    console.log('Trying CTM native transcript...')
    const transcriptData = await ctmClient.calls.getCallTranscript(id)
    if (transcriptData) {
      return NextResponse.json({ 
        transcript: transcriptData,
        audioUrl: call.recordingUrl,
        duration: call.duration,
        callId: id,
      })
    }

    return NextResponse.json({ 
      transcript: null, 
      error: 'No transcription available. Configure ASSEMBLYAI_API_KEY for audio transcription.',
      callId: id 
    })
  } catch (error) {
    console.error('CTM transcript error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch transcript',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}