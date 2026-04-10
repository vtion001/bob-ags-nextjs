import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { DEV_BYPASS_UID, isDevUser } from '@/lib/auth/is-dev-user'

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null

    if (isDevUser(request)) {
      userId = DEV_BYPASS_UID
    } else {
      const { supabase } = await createServerSupabase(request)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = session.user.id
    }

    const { supabase } = await createServerSupabase(request)

    // Seed default permissions for user
    const { data, error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId!,
        role: 'viewer',
        permissions: {
          can_view_calls: true,
          can_view_monitor: true,
          can_view_history: false,
          can_view_agents: false,
          can_manage_settings: false,
          can_manage_users: false,
          can_run_analysis: false,
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error seeding permissions:', error)
      return NextResponse.json(
        { error: 'Failed to seed permissions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      role: data.role,
      permissions: data.permissions
    })
  } catch (error) {
    console.error('Permissions seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed permissions' },
      { status: 500 }
    )
  }
}
