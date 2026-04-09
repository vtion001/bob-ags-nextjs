import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'

function isDevUser(request: NextRequest): boolean {
  const devSessionCookie = request.cookies.get('sb-dev-session')
  if (devSessionCookie) {
    try {
      const devSession = JSON.parse(devSessionCookie.value)
      if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
        return true
      }
    } catch {}
  }
  const sessionCookie = request.cookies.get('sb-session')
  if (sessionCookie?.value === 'dev-session-placeholder') {
    return true
  }
  return false
}

export async function POST(request: NextRequest) {
  try {
    let userId: string | null = null

    if (isDevUser(request)) {
      userId = DEV_BYPASS_UID
    } else {
      const supabase = await createServerSupabase(request)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      userId = user.id
    }

    const supabase = await createServerSupabase(request)

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
