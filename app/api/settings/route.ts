import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'

export async function GET(request: NextRequest) {
  try {
    // Dev bypass check
    const devSessionCookie = request.cookies.get('sb-dev-session')
    let isDevUser = false
    let userId = null

    if (devSessionCookie) {
      try {
        const devSession = JSON.parse(devSessionCookie.value)
        if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
          isDevUser = true
          userId = DEV_BYPASS_UID
        }
      } catch {}
    }

    let supabase = null
    if (!isDevUser) {
      supabase = (await createServerSupabase(request)).supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    } else {
      // For dev user, create supabase client without auth
      supabase = (await createServerSupabase(request)).supabase
    }

    const { data: userSettings, error } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', userId)
      .single()

    if (error || !userSettings) {
      return NextResponse.json({
        success: true,
        settings: {
          ctm_access_key: '',
          ctm_secret_key: '',
          ctm_account_id: '',
          openrouter_api_key: '',
          default_client: 'flyland',
          light_mode: true,
          email_notifications: false,
          auto_sync_calls: true,
          call_sync_interval: 60,
        }
      })
    }

    return NextResponse.json({
      success: true,
      settings: userSettings.settings
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Dev bypass check
    const devSessionCookie = request.cookies.get('sb-dev-session')
    let isDevUser = false
    let userId = null

    if (devSessionCookie) {
      try {
        const devSession = JSON.parse(devSessionCookie.value)
        if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
          isDevUser = true
          userId = DEV_BYPASS_UID
        }
      } catch {}
    }

    let supabase = null
    if (!isDevUser) {
      supabase = (await createServerSupabase(request)).supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    } else {
      supabase = (await createServerSupabase(request)).supabase
    }

    const body = await request.json()

    // Dev users don't have real auth entries - skip actual DB write but return success
    if (isDevUser) {
      return NextResponse.json({
        success: true,
        settings: body,
        note: 'Dev mode - settings not persisted'
      })
    }

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        settings: body
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving settings:', error)
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: data.settings
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Dev bypass check
    const devSessionCookie = request.cookies.get('sb-dev-session')
    let isDevUser = false
    let userId = null

    if (devSessionCookie) {
      try {
        const devSession = JSON.parse(devSessionCookie.value)
        if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
          isDevUser = true
          userId = DEV_BYPASS_UID
        }
      } catch {}
    }

    let supabase = null
    if (!isDevUser) {
      supabase = (await createServerSupabase(request)).supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    } else {
      supabase = (await createServerSupabase(request)).supabase
    }

    const { error } = await supabase
      .from('user_settings')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting settings:', error)
      return NextResponse.json(
        { error: 'Failed to delete settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Settings deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting settings:', error)
    return NextResponse.json(
      { error: 'Failed to delete settings' },
      { status: 500 }
    )
  }
}
