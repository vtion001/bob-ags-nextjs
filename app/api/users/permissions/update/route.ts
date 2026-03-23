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

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.email !== DEV_EMAIL) {
      const { data: currentUserRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (currentUserRole?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { targetUserId, email, role, permissions } = body

    if (!targetUserId || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (targetUserId === DEV_EMAIL || email === DEV_EMAIL) {
      return NextResponse.json({ error: 'Cannot modify admin user' }, { status: 400 })
    }

    // Try UPDATE first, then INSERT if no rows affected
    const { data: existing, error: fetchError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', targetUserId)
      .single()

    let data, error

    if (existing) {
      // Update existing record
      const result = await supabase
        .from('user_roles')
        .update({
          email,
          role,
          permissions,
          approved: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', targetUserId)
        .select()
        .single()
      data = result.data
      error = result.error
    } else {
      // Insert new record
      const result = await supabase
        .from('user_roles')
        .insert({
          user_id: targetUserId,
          email,
          role,
          permissions,
          approved: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error updating user role:', error)
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Update permissions error:', error)
    return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If user is dev admin, skip role check
    if (user.email !== DEV_EMAIL) {
      try {
        const { data: currentUserRole } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (currentUserRole?.role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
        }
      } catch (roleError) {
        // Table might not exist yet, allow access for now
        console.error('Role check error:', roleError)
      }
    }

    const { data: allRoles, error } = await supabase
      .from('user_roles')
      .select('*')
      .order('created_at', { ascending: false })

    // If error (like table not existing), return empty array
    if (error) {
      console.error('Error fetching all roles:', error)
      return NextResponse.json({ roles: [] })
    }

    return NextResponse.json({ roles: allRoles || [] })
  } catch (error) {
    console.error('Get all roles error:', error)
    // Return empty array instead of 500 to not break the UI
    return NextResponse.json({ roles: [] })
  }
}
