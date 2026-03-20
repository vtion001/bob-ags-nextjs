import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error)
    }

    return NextResponse.json({ 
      settings: data?.settings || {
        ctm_access_key: '',
        ctm_secret_key: '',
        ctm_account_id: '',
        openrouter_api_key: '',
        default_client: 'flyland',
        light_mode: true,
        email_notifications: false,
        auto_sync_calls: true,
        call_sync_interval: 60,
        ctm_agent_id: null,
        ctm_user_group_id: null,
      }
    })
  } catch (error) {
    console.error('Settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}
