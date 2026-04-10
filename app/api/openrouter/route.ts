import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { analyzeTranscript } from '@/lib/ai/analyzer'
import { DEV_BYPASS_UID, isDevUser } from '@/lib/auth/is-dev-user'

export async function POST(request: NextRequest) {
  try {
    if (!isDevUser(request)) {
      const { supabase } = await createServerSupabase(request)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { transcript, phone, client, ctmStarRating } = body

    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured'
      }, { status: 500 })
    }

    const analysis = await analyzeTranscript(
      transcript,
      phone || '',
      client,
      ctmStarRating
    )

    return NextResponse.json({
      success: true,
      analysis
    })
  } catch (error) {
    console.error('OpenAI error:', error)
    return NextResponse.json(
      { error: 'Failed to process OpenAI request' },
      { status: 500 }
    )
  }
}
