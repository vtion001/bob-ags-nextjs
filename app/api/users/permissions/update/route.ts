import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { DEFAULT_PERMISSIONS, RoleType } from '@/lib/settings/types'
import { DEV_BYPASS_UID, isDevUser } from '@/lib/auth/is-dev-user'

export async function GET(request: NextRequest) {
  try {
    let userId: string | null = null
    let isAdminUser = false
    let userEmail: string | null = null

    if (isDevUser(request)) {
      userId = DEV_BYPASS_UID
      isAdminUser = true
      userEmail = 'agsdev@allianceglobalsolutions.com'
      console.log('[DEBUG] Dev user detected, isAdminUser=true')
    } else {
      const { supabase } = await createServerSupabase(request)
      // MUST use getSession() to refresh tokens, otherwise auth.uid() returns null
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      const user = session.user
      userId = user.id
      userEmail = user.email || null
      console.log('[DEBUG] Logged in user:', userEmail, 'userId:', userId)

      // Check if current user is admin - try by user_id first, then by email
      const superAdminEmails = [
        'agsdev@allianceglobalsolutions.com',
        'v.rodriguez@allianceglobalsolutions.com',
      ]
      const userEmailLower = userEmail?.toLowerCase()

      let { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single()

      console.log('[DEBUG] userRole by user_id:', userRole)

      // If not found by user_id, try by email
      if (!userRole && userEmailLower) {
        const { data: userRoleByEmail } = await supabase
          .from('user_roles')
          .select('role')
          .eq('email', userEmailLower)
          .single()

        console.log('[DEBUG] userRole by email:', userRoleByEmail)
        userRole = userRoleByEmail
      }

      // Superadmin emails always get admin access for this endpoint
      const isSuperAdmin = userEmailLower && superAdminEmails.includes(userEmailLower)
      console.log('[DEBUG] isSuperAdmin:', isSuperAdmin)

      isAdminUser = !!(userRole?.role === 'admin' || isSuperAdmin)
    }

    const { supabase } = await createServerSupabase(request)

    // If admin, return all users with their roles using service role key to bypass RLS
    if (isAdminUser) {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      console.log('[DEBUG] Env check - URL:', supabaseUrl ? 'SET' : 'UNSET', 'ServiceKey:', serviceKey ? 'SET' : 'UNSET')

      if (!supabaseUrl || !serviceKey) {
        console.error('[DEBUG] Missing env vars - cannot create admin client')
        return NextResponse.json(
          { error: 'Server configuration error - missing env vars' },
          { status: 500 }
        )
      }

      const supabaseAdmin = createClient(
        supabaseUrl,
        serviceKey,
        { auth: { persistSession: false } }
      )

      // First verify admin client works by listing tables
      const { data: testData, error: testError } = await supabaseAdmin.from('user_roles').select('user_id').limit(1)
      console.log('[DEBUG] Admin client test - rows:', testData?.length, 'error:', testError)

      const { data: allRoles, error: allRolesError } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('[DEBUG] All roles from service client:', allRoles?.length, 'error:', allRolesError)
      if (allRoles && allRoles.length > 0) {
        console.log('[DEBUG] First user in result:', JSON.stringify(allRoles[0]))
        console.log('[DEBUG] All user emails:', allRoles.map(u => `${u.email} (approved=${u.approved})`).join(', '))
      }

      if (allRolesError) {
        console.error('Error fetching all roles:', allRolesError)
      }

      return NextResponse.json({
        success: true,
        role: 'admin',
        roles: allRoles || [],
        email: userEmail,
      })
    }

    // Non-admin: return only current user's permissions
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select('role, permissions')
      .eq('user_id', userId!)
      .single()

    if (error || !userRole) {
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
      permissions: userRole.permissions || {},
      email: userEmail,
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

export async function PUT(request: NextRequest) {
  let targetUserIdValue: string = ''

  try {
    let currentUserId: string | null = null

    if (isDevUser(request)) {
      currentUserId = DEV_BYPASS_UID
    } else {
      const { supabase } = await createServerSupabase(request)
      // MUST use getSession() to refresh tokens, otherwise auth.uid() returns null
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      currentUserId = session.user.id
    }

    const body = await request.json()
    const { role, permissions, targetUserId } = body

    // Use service role to bypass RLS recursion
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Determine which user to update
    // If targetUserId is an email, look up the user by email
    // If targetUserId is a user_id (UUID), use it directly
    // Otherwise, use the current authenticated user's id
    targetUserIdValue = targetUserId

    if (targetUserId && !targetUserId.includes('@') && targetUserId.length > 30) {
      // This is a UUID (Supabase user id) - use it directly
      targetUserIdValue = targetUserId
    } else if (targetUserId && targetUserId.includes('@')) {
      // This is an email - look up the user by email (case-insensitive)
      // First check user_roles
      const { data: existingUser } = await supabaseAdmin
        .from('user_roles')
        .select('user_id, email')
        .ilike('email', targetUserId)
        .single()

      if (existingUser) {
        targetUserIdValue = existingUser.user_id
      } else {
        // User not in user_roles yet - check if they exist in auth.users
        // Use a case-insensitive search
        const { data: authUser } = await supabaseAdmin
          .from('auth.users')
          .select('id, email')
          .ilike('email', targetUserId)
          .single()

        if (authUser) {
          targetUserIdValue = authUser.id
        } else {
          // User hasn't signed up yet
          return NextResponse.json(
            { error: 'User not found. They must sign up first before you can assign a role.' },
            { status: 404 }
          )
        }
      }
    } else {
      // Fall back to current user's id
      targetUserIdValue = currentUserId!
    }

    // Upsert user permissions in Supabase
    // Get the email to use - prefer the targetUserId email or lookup from auth.users
    let emailToUse: string | null = null
    if (targetUserId && targetUserId.includes('@')) {
      emailToUse = targetUserId.toLowerCase()
    } else if (targetUserIdValue && !targetUserIdValue.includes('@')) {
      // It's a UUID - look up the email from auth.users
      const { data: authUserForEmail } = await supabaseAdmin
        .from('auth.users')
        .select('email')
        .eq('id', targetUserIdValue)
        .single()
      emailToUse = authUserForEmail?.email?.toLowerCase() || null
    }

    // Validate role is a valid RoleType, default to 'viewer' if not
    const validRoles: RoleType[] = ['admin', 'manager', 'viewer', 'qa']
    const safeRole: RoleType = validRoles.includes(role as RoleType) ? role as RoleType : 'viewer'

    // Use provided permissions or fall back to DEFAULT_PERMISSIONS for the role
    const permissionsToUse = permissions && Object.keys(permissions).length > 0
      ? permissions
      : DEFAULT_PERMISSIONS[safeRole]

    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: targetUserIdValue,
        email: emailToUse,
        role: safeRole,
        permissions: permissionsToUse,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating permissions:', error)
      return NextResponse.json(
        { error: 'Failed to update permissions', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      role: data.role,
      permissions: data.permissions
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update permissions', details: message, userId: targetUserIdValue },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    let currentUserId: string | null = null

    if (isDevUser(request)) {
      currentUserId = DEV_BYPASS_UID
    } else {
      const { supabase } = await createServerSupabase(request)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      currentUserId = session.user.id
    }

    const { searchParams } = await request.nextUrl
    const targetUserId = searchParams.get('user_id')

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    // Use service role to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { error } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', targetUserId)

    if (error) {
      console.error('Error deleting user role:', error)
      return NextResponse.json(
        { error: 'Failed to delete user', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to delete user', details: message },
      { status: 500 }
    )
  }
}
