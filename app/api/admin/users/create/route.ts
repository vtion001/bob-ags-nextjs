import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'

function isDevUser(request: NextRequest): boolean {
  const devSessionCookie = request.cookies.get('sb-dev-session')
  if (!devSessionCookie) return false
  try {
    const devSession = JSON.parse(devSessionCookie.value)
    if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
      return true
    }
  } catch {}
  return false
}

export async function POST(request: NextRequest) {
  try {
    if (!isDevUser(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, password, role = 'viewer' } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase(request)

    // Create admin client with service role key
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create the auth user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    const userId = authData.user.id

    // Get default permissions for the role
    const rolePermissions: Record<string, any> = {
      admin: {
        can_view_calls: true,
        can_view_monitor: true,
        can_view_history: true,
        can_view_agents: true,
        can_manage_settings: true,
        can_manage_users: true,
        can_run_analysis: true,
      },
      manager: {
        can_view_calls: true,
        can_view_monitor: true,
        can_view_history: true,
        can_view_agents: true,
        can_manage_settings: false,
        can_manage_users: false,
        can_run_analysis: true,
      },
      qa: {
        can_view_calls: true,
        can_view_monitor: true,
        can_view_history: true,
        can_view_agents: true,
        can_manage_settings: false,
        can_manage_users: false,
        can_run_analysis: true,
      },
      viewer: {
        can_view_calls: true,
        can_view_monitor: true,
        can_view_history: false,
        can_view_agents: false,
        can_manage_settings: false,
        can_manage_users: false,
        can_run_analysis: false,
      },
      agent: {
        can_view_calls: false,
        can_view_monitor: true,
        can_view_history: false,
        can_view_agents: false,
        can_manage_settings: false,
        can_manage_users: false,
        can_run_analysis: false,
      },
    }

    const permissions = rolePermissions[role] || rolePermissions.viewer

    // Create user_roles entry
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        email: email.toLowerCase(),
        role,
        approved: true,
        permissions,
      })

    if (roleError) {
      console.error('Error creating user_roles entry:', roleError)
      // Auth user was created, but role assignment failed
      return NextResponse.json({
        success: true,
        warning: 'Auth user created but role assignment failed',
        userId,
        error: roleError.message
      })
    }

    // Create public.users entry
    await supabase
      .from('users')
      .upsert({
        id: userId,
        email: email.toLowerCase(),
        is_superadmin: role === 'admin',
      })

    return NextResponse.json({
      success: true,
      userId,
      email,
      role,
      permissions
    })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
