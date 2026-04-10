import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

// Dev bypass session constants
const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'
const DEV_BYPASS_EMAIL = 'dev@bob.local'
const DEV_BYPASS_ROLE = 'admin'

export async function GET(request: NextRequest) {
  try {
    // Check for dev bypass session FIRST
    const devSessionCookie = request.cookies.get('sb-dev-session')
    if (devSessionCookie) {
      try {
        const devSession = JSON.parse(devSessionCookie.value)
        if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
          return NextResponse.json({
            success: true,
            user: {
              id: DEV_BYPASS_UID,
              email: DEV_BYPASS_EMAIL,
              name: 'Dev User',
            },
            session: {
              expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000)
            },
            role: DEV_BYPASS_ROLE,
            permissions: {
              can_view_calls: true,
              can_view_monitor: true,
              can_view_history: true,
              can_view_agents: true,
              can_manage_settings: true,
              can_manage_users: true,
              can_run_analysis: true,
            }
          })
        }
      } catch {
        // Invalid cookie, fall through to normal auth
      }
    }

    const { supabase } = await createServerSupabase(request)
    // MUST use getSession() (not getUser()) to ensure token refresh
    // getUser() only validates JWT locally without refresh, causing auth.uid() to return null
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError.message)
    }

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      )
    }

    const user = session.user

    // Get user role and permissions — wrap in try/catch for safety
    let userRole = null
    try {
      const { data, error: roleError } = await supabase
        .from('user_roles')
        .select('role, permissions')
        .eq('user_id', user.id)
        .single()

      if (roleError) {
        // Distinguish between "row not found" and actual query errors
        if (roleError.code === 'PGRST116') {
          // Row not found - OK to fall back to viewer
          console.log('[session] user:', user.email, 'role query: no row found, falling back to viewer')
        } else {
          // Query failed (RLS blocked, connection error, etc.) — return 500
          console.error('[session] user:', user.email, 'role query failed:', roleError.message, 'code:', roleError.code)
          return NextResponse.json(
            { error: 'Failed to fetch user role' },
            { status: 500 }
          )
        }
      } else {
        userRole = data
        console.log('[session] user:', user.email, 'userRole:', userRole, 'sessionError:', sessionError)
      }
    } catch (error) {
      console.error('[session] user:', user.email, 'role query threw:', error)
      return NextResponse.json(
        { error: 'Failed to fetch user role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null,
      },
      session: {
        expires_at: user.app_metadata?.exp || null
      },
      role: userRole?.role || 'viewer',
      permissions: userRole?.permissions || {}
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}
