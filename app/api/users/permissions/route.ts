import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user permissions from Supabase - check by user_id first, then fallback to email
    let { data: userRole, error } = await supabase
      .from('user_roles')
      .select('role, permissions')
      .eq('user_id', user.id)
      .single()

    // If no match by user_id, try by email (for users created via OAuth or when user_id didn't match)
    if (error || !userRole) {
      const userEmail = user.email?.toLowerCase()
      const devEmail = 'agsdev@allianceglobalsolutions.com'

      // Special case: dev user always gets admin permissions
      if (userEmail === devEmail) {
        return NextResponse.json({
          success: true,
          role: 'admin',
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

      // Try finding by email
      const { data: userRoleByEmail } = await supabase
        .from('user_roles')
        .select('role, permissions')
        .eq('email', userEmail)
        .single()

      if (userRoleByEmail) {
        return NextResponse.json({
          success: true,
          role: userRoleByEmail.role,
          permissions: userRoleByEmail.permissions || {}
        })
      }

      return NextResponse.json({
        success: true,
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
    }

    return NextResponse.json({
      success: true,
      role: userRole.role,
      permissions: userRole.permissions || {}
    })
  } catch (error) {
    console.error('Permissions error:', error)
    return NextResponse.json({
      success: true,
      role: 'viewer',
      permissions: {}
    })
  }
}
