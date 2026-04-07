import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { DEFAULT_PERMISSIONS, RoleType, UserPermissions } from '@/lib/settings/types'

// Dev bypass constants
const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'
const DEV_BYPASS_EMAIL = 'dev@bob.local'

function getPermissionsForRole(role: string): UserPermissions {
  const validRoles: RoleType[] = ['admin', 'manager', 'viewer', 'qa', 'agent']
  if (validRoles.includes(role as RoleType)) {
    return DEFAULT_PERMISSIONS[role as RoleType]
  }
  return DEFAULT_PERMISSIONS['viewer']
}

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
      } catch {
        // Invalid cookie, fall through to normal auth
      }
    }

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
          // Use stored permissions or fall back to DEFAULT_PERMISSIONS for the role
          permissions: userRoleByEmail.permissions && Object.keys(userRoleByEmail.permissions).length > 0
            ? userRoleByEmail.permissions
            : getPermissionsForRole(userRoleByEmail.role)
        })
      }

      // No role found - return viewer with default permissions
      return NextResponse.json({
        success: true,
        role: 'viewer',
        permissions: DEFAULT_PERMISSIONS['viewer']
      })
    }

    return NextResponse.json({
      success: true,
      role: userRole.role,
      // Use stored permissions or fall back to DEFAULT_PERMISSIONS for the role
      permissions: userRole.permissions && Object.keys(userRole.permissions).length > 0
        ? userRole.permissions
        : getPermissionsForRole(userRole.role)
    })
  } catch (error) {
    console.error('Permissions error:', error)
    return NextResponse.json({
      success: true,
      role: 'viewer',
      permissions: DEFAULT_PERMISSIONS['viewer']
    })
  }
}
