import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

interface QAOverride {
  criterionId: string
  overridePass: boolean
  originalPass: boolean
  overrideNote?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { callId, overrides, manualScore } = await request.json()

    if (!callId) {
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 })
    }

    if (!overrides || !Array.isArray(overrides)) {
      return NextResponse.json({ error: 'Overrides array is required' }, { status: 400 })
    }

    const overrideRecord = {
      call_id: callId,
      user_id: user.id,
      overrides: overrides,
      manual_score: manualScore,
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('qa_overrides')
      .insert(overrideRecord)
      .select()
      .single()

    if (error) {
      console.error('Failed to save QA override:', error)
      return NextResponse.json({ error: 'Failed to save override' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      overrideId: data.id,
      message: `Saved ${overrides.length} override(s)` 
    })
  } catch (err) {
    console.error('QA override API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const callId = searchParams.get('callId')

    if (!callId) {
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('qa_overrides')
      .select('*')
      .eq('call_id', callId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch QA override:', error)
      return NextResponse.json({ error: 'Failed to fetch override' }, { status: 500 })
    }

    return NextResponse.json({ 
      override: data || null 
    })
  } catch (err) {
    console.error('QA override API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
