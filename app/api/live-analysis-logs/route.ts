import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { DEV_BYPASS_UID, isDevUser } from '@/lib/auth/is-dev-user'

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null
    const { supabase } = await createServerSupabase(request)

    if (!isDevUser(request)) {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = session.user.id
    } else {
      userId = DEV_BYPASS_UID
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Dev users get empty results (they don't have a real auth entry)
    if (isDevUser(request)) {
      return NextResponse.json({
        success: true,
        data: [],
        logs: []
      })
    }

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
  try {
    let userId: string | null = null

    if (!isDevUser(request)) {
      const { supabase } = await createServerSupabase(request)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = session.user.id

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
    }

    // Dev user — return mock success without persisting
    return NextResponse.json({
      success: true,
      data: { id: 'dev-mock', user_id: DEV_BYPASS_UID },
      note: 'Dev mode'
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
  try {
    let userId: string | null = null
    const { supabase } = await createServerSupabase(request)

    if (!isDevUser(request)) {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = session.user.id
    } else {
      userId = DEV_BYPASS_UID
    }

    // Dev users get a no-op delete
    if (isDevUser(request)) {
      return NextResponse.json({
        success: true,
        message: 'Dev mode - delete skipped'
      })
    }

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
