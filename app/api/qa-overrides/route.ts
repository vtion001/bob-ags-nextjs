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
    const supabase = await createServerSupabase(request)

    if (!isDevUser) {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '25', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Fetch calls that have been analyzed (have score/rubric_results)
    // This matches what the QA Logs page expects
    const { data, error, count } = await supabase
      .from('calls')
      .select('id, ctm_call_id, phone, caller_number, direction, duration, score, sentiment, created_at, agent_name, disposition', { count: 'exact' })
      .not('score', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        calls: [],
        total: 0
      })
    }

    return NextResponse.json({
      success: true,
      calls: data || [],
      total: count || 0
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      calls: [],
      total: 0
    })
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
    const supabase = await createServerSupabase(request)

    if (!isDevUser) {
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
    }

    const body = await request.json()

    // Store QA override in Supabase
    const { data, error } = await supabase
      .from('qa_overrides')
      .insert({ ...body, user_id: userId })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create QA override' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      qa_override: data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create QA override' },
      { status: 500 }
    )
  }
}
