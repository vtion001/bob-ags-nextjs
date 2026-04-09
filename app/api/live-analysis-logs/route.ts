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
    let userId: string | null = null
    let supabase

    if (!isDevUser) {
      const { supabase } = await createServerSupabase(request)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = user.id
    } else {
      userId = DEV_BYPASS_UID
      // Use service role key to bypass RLS for dev users
      const { createClient } = await import('@supabase/supabase-js')
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const { data: logs, error } = await supabase
      .from('live_analysis_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching live analysis logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch live analysis logs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: logs || [],
      logs: logs || []
    })
  } catch (error) {
    console.error('Error fetching live analysis logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live analysis logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    let userId: string | null = null
    let supabase

    if (!isDevUser) {
      supabase = await createServerSupabase(request)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = user.id
    } else {
      userId = DEV_BYPASS_UID
      // Use service role key to bypass RLS for dev users
      const { createClient } = await import('@supabase/supabase-js')
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
    }

    const body = await request.json()
    const { call_id, call_phone, call_direction, call_timestamp, suggested_disposition, insights, transcript_preview } = body

    const { data: log, error } = await supabase
      .from('live_analysis_logs')
      .insert({
        user_id: userId,
        call_id,
        call_phone,
        call_direction,
        call_timestamp,
        suggested_disposition,
        insights,
        transcript_preview
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating live analysis log:', error)
      return NextResponse.json(
        { error: 'Failed to create live analysis log' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: log
    })
  } catch (error) {
    console.error('Error creating live analysis log:', error)
    return NextResponse.json(
      { error: 'Failed to create live analysis log' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    let userId: string | null = null
    let supabase

    if (!isDevUser) {
      supabase = await createServerSupabase(request)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = user.id
    } else {
      userId = DEV_BYPASS_UID
      // Use service role key to bypass RLS for dev users
      const { createClient } = await import('@supabase/supabase-js')
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false } }
      )
    }

    // Delete all logs for this user
    const { error } = await supabase
      .from('live_analysis_logs')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting live analysis logs:', error)
      return NextResponse.json(
        { error: 'Failed to delete live analysis logs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'All logs deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting live analysis logs:', error)
    return NextResponse.json(
      { error: 'Failed to delete live analysis logs' },
      { status: 500 }
    )
  }
}
