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

    // Get user permissions from Supabase
    const { data: userRole, error } = await supabase
      .from('user_roles')
      .select('role, permissions')
      .eq('user_id', user.id)
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

export async function PUT(request: NextRequest) {
  let targetUserIdValue: string

  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
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
      targetUserIdValue = user.id
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

    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: targetUserIdValue,
        email: emailToUse,
        role: role || 'viewer',
        permissions: permissions || {},
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
    console.error('Permissions update error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to update permissions', details: message, userId: targetUserIdValue },
      { status: 500 }
    )
  }
}
