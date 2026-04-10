import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { DEV_BYPASS_UID, isDevUser } from '@/lib/auth/is-dev-user'

export async function GET(request: NextRequest) {
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

    // Get CTM assignments from Supabase
    const { data: assignmentsData, error } = await supabase
      .from('ctm_assignments')
      .select('*')
      .eq('user_id', userId!)

    if (error) {
      console.error('Error fetching CTM assignments:', error)
      return NextResponse.json({
        success: true,
        assignments: []
      })
    }

    // Get user info (email and role) for each assignment
    const userIds = (assignmentsData || []).map(a => a.user_id).filter(Boolean)
    let userMap: Record<string, { email: string; role: string }> = {}

    if (userIds.length > 0) {
      const { data: usersData } = await supabase
        .from('user_roles')
        .select('user_id, email, role')
        .in('user_id', userIds)

      if (usersData) {
        userMap = usersData.reduce((acc, u) => {
          acc[u.user_id] = { email: u.email || u.user_id, role: u.role || 'viewer' }
          return acc
        }, {} as Record<string, { email: string; role: string }>)
      }
    }

    // Transform raw assignments to CTMAssignment format
    const transformedAssignments = (assignmentsData || []).map(a => ({
      userId: a.user_id,
      email: userMap[a.user_id]?.email || a.user_id,
      role: userMap[a.user_id]?.role || 'viewer',
      ctmAgentId: a.ctm_agent_id || null,
      ctmUserGroupId: a.ctm_user_group_id || null,
    }))

    return NextResponse.json({
      success: true,
      assignments: transformedAssignments
    })
  } catch (error) {
    console.error('CTM assignments error:', error)
    return NextResponse.json({
      success: true,
      assignments: []
    })
  }
}

export async function PUT(request: NextRequest) {
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

    const body = await request.json()

    // Update CTM assignments in Supabase
    const { data, error } = await supabase
      .from('ctm_assignments')
      .upsert({
        user_id: userId!,
        ...body
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating CTM assignments:', error)
      return NextResponse.json(
        { error: 'Failed to update CTM assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      assignments: data
    })
  } catch (error) {
    console.error('CTM assignments error:', error)
    return NextResponse.json(
      { error: 'Failed to update CTM assignments' },
      { status: 500 }
    )
  }
}
