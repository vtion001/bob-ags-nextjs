import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const DEV_EMAIL = 'agsdev@allianceglobalsolutions.com'

const adminPermissions = {
  can_view_calls: true,
  can_view_monitor: true,
  can_view_history: true,
  can_view_agents: true,
  can_manage_settings: true,
  can_manage_users: true,
  can_run_analysis: true,
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.email === DEV_EMAIL) {
      return NextResponse.json({
        userId: user.id,
        email: user.email,
        role: 'admin',
        permissions: adminPermissions,
      })
    }

    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user role:', error)
    }

    const defaultPermissions = {
      can_view_calls: true,
      can_view_monitor: true,
      can_view_history: false,
      can_view_agents: false,
      can_manage_settings: false,
      can_manage_users: false,
      can_run_analysis: true,
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      role: userRole?.role || 'viewer',
      permissions: userRole?.permissions || defaultPermissions,
    })
  } catch (error) {
    console.error('Permissions error:', error)
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
  }
}
