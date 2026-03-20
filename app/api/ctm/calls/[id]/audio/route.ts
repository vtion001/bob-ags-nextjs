import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CTMClient } from '@/lib/ctm'

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
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    if (!call.recordingUrl) {
      return NextResponse.json({ error: 'No recording available' }, { status: 404 })
    }

    const audioResponse = await fetch(call.recordingUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(
          process.env.CTM_ACCESS_KEY + ':' + process.env.CTM_SECRET_KEY
        ).toString('base64')}`,
      },
    })

    if (!audioResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch audio' }, { status: 500 })
    }

    const audioBuffer = await audioResponse.arrayBuffer()
    const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg'

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="recording-${id}.mp3"`,
      },
    })
  } catch (error) {
    console.error('CTM audio proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audio' },
      { status: 500 }
    )
  }
}
