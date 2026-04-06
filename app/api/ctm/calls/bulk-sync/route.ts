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
      const supabase = await createServerSupabase(request)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Bulk sync is a no-op in standalone mode - returns empty result
    return NextResponse.json({
      success: true,
      synced: 0,
      message: 'Bulk sync completed (no-op in standalone mode)'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to perform bulk sync' },
      { status: 500 }
    )
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
      const supabase = await createServerSupabase(request)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Bulk sync is a no-op in standalone mode - returns empty result
    return NextResponse.json({
      success: true,
      synced: 0,
      message: 'Bulk sync completed (no-op in standalone mode)'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to perform bulk sync' },
      { status: 500 }
    )
  }
}
