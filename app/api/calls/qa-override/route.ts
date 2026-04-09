import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: NextRequest) {
  try {
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

    if (!isDevUser) {
      const { supabase } = await createServerSupabase(request)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Return empty qa-overrides - stored in Supabase
    const { supabase: supabaseForQuery } = await createServerSupabase(request)
    const { data, error } = await supabaseForQuery
      .from('qa_overrides')
      .select('*')
      .limit(100)

    if (error) {
      return NextResponse.json({
        success: true,
        qa_overrides: []
      })
    }

    return NextResponse.json({
      success: true,
      qa_overrides: data || []
    })
  } catch (error) {
    return NextResponse.json({
      success: true,
      qa_overrides: []
    })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (!isDevUser) {
      const { supabase } = await createServerSupabase(request)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()

    // Store QA override in Supabase
    const { supabase: supabaseForInsert } = await createServerSupabase(request)
    const { data, error } = await supabaseForInsertForQuery
      .from('qa_overrides')
      .insert(body)
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
