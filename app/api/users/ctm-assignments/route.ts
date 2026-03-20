import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CTMClient } from '@/lib/ctm'

const DEV_EMAIL = 'agsdev@allianceglobalsolutions.com'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isDevAdmin = user.email === DEV_EMAIL
    if (!isDevAdmin) {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (userRole?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
      }
    }

    const { data: allRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, email, role')
      .order('created_at', { ascending: false })

    if (rolesError) {
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    const { data: allSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id, settings')

    if (settingsError) {
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    const ctmClient = new CTMClient()
    let agents: Awaited<ReturnType<CTMClient['agents']['getAgents']>> = []
    let userGroups: Awaited<ReturnType<CTMClient['agents']['getUserGroups']>> = []

    try {
      agents = await ctmClient.agents.getAgents()
      userGroups = await ctmClient.agents.getUserGroups()
    } catch {
      // CTM might not be configured, continue without agents/groups
    }

    const settingsMap = new Map(
      (allSettings || []).map(s => [s.user_id, s.settings])
    )

    const usersWithAssignments = (allRoles || []).map(r => {
      const s = settingsMap.get(r.user_id) || {}
      return {
        userId: r.user_id,
        email: r.email,
        role: r.role,
        ctmAgentId: s.ctm_agent_id || null,
        ctmUserGroupId: s.ctm_user_group_id || null,
      }
    })

    return NextResponse.json({
      users: usersWithAssignments,
      ctmAgents: agents,
      ctmUserGroups: userGroups,
    })
  } catch (error) {
    console.error('CTM assignments error:', error)
    return NextResponse.json({ error: 'Failed to fetch CTM assignments' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isDevAdmin = user.email === DEV_EMAIL
    if (!isDevAdmin) {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (userRole?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { targetUserId, ctmAgentId, ctmUserGroupId } = body

    if (!targetUserId) {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', targetUserId)
      .single()

    const currentSettings = existing?.settings || {}

    const updatedSettings = {
      ...currentSettings,
      ctm_agent_id: ctmAgentId || null,
      ctm_user_group_id: ctmUserGroupId || null,
    }

    const { error: upsertError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: targetUserId,
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      console.error('Error saving CTM assignment:', upsertError)
      return NextResponse.json({ error: 'Failed to save CTM assignment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('CTM assignment save error:', error)
    return NextResponse.json({ error: 'Failed to save CTM assignment' }, { status: 500 })
  }
}
