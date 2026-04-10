import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { DEV_BYPASS_UID, isDevUser } from '@/lib/auth/is-dev-user'

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await createServerSupabase(request)

    if (!isDevUser(request)) {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
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
    const { data, error } = await supabase.rpc('get_analyzed_calls_paginated', {
      p_limit: limit,
      p_offset: offset
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        calls: [],
        total: 0
      })
    }

    const calls = data || []
    const total = calls.length > 0 ? calls[0].total_count || calls.length : 0

    // Remove total_count from each call before returning
    const cleanCalls = calls.map(({ total_count, ...call }: { total_count?: number; [key: string]: unknown }) => call)

    return NextResponse.json({
      success: true,
      calls: cleanCalls,
      total
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
