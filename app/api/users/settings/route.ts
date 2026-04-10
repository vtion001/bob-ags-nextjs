import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { DEV_BYPASS_UID, isDevUser } from '@/lib/auth/is-dev-user'

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null
    let { supabase } = await createServerSupabase(request)

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
