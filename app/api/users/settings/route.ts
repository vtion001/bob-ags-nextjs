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
    let { supabase } = await createServerSupabase(request)

    if (!isDevUser) {
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
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    )
  }
}
