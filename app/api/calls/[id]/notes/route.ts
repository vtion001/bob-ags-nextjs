import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: NextRequest) {
  // Dev bypass check
  const devSessionCookie = request.cookies.get('sb-dev-session')
  let isDevUser = false
  if (devSessionCookie) {
    try {
      const devSession = JSON.parse(devSessionCookie.value)
      if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
        isDevUser = true
      }
    } catch {}
  }

  try {
    const { supabase } = await createServerSupabase(request)

    if (!isDevUser) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const searchParams = request.nextUrl.searchParams
    const callId = searchParams.get('callId')

    if (!callId) {
      return NextResponse.json({ error: 'callId is required' }, { status: 400 })
    }

    // Get notes from Supabase
    const { data, error } = await supabase
      .from('call_notes')
      .select('*')
      .eq('call_id', callId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({
        success: true,
        notes: []
      })
    }

    return NextResponse.json({
      success: true,
      notes: data || []
    })
  } catch (error) {
    return NextResponse.json({
      success: true,
      notes: []
    })
  }
}

export async function PATCH(request: NextRequest) {
  // Dev bypass check
  const devSessionCookie = request.cookies.get('sb-dev-session')
  let isDevUser = false
  if (devSessionCookie) {
    try {
      const devSession = JSON.parse(devSessionCookie.value)
      if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
        isDevUser = true
      }
    } catch {}
  }

  try {
    const { supabase } = await createServerSupabase(request)

    if (!isDevUser) {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { callId, notes } = body || {}

    if (!callId) {
      return NextResponse.json({ error: 'callId is required' }, { status: 400 })
    }

    // Update or insert notes in Supabase
    const { data, error } = await supabase
      .from('call_notes')
      .upsert({
        call_id: callId,
        notes: notes || '',
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update notes' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notes: data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update notes' },
      { status: 500 }
    )
  }
}
