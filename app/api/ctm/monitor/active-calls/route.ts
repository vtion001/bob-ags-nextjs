import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
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

    const searchParams = request.nextUrl.searchParams
    const manualAgentId = searchParams.get('agentId')
    const manualGroupId = searchParams.get('groupId')

    const isDevAdmin = user.email === DEV_EMAIL

    if (!isDevAdmin) {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (userRole?.role !== 'admin') {
        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('settings')
          .eq('user_id', user.id)
          .single()

        const settings = userSettings?.settings || {}
        const assignedAgentId = settings.ctm_agent_id || manualAgentId
        const assignedGroupId = settings.ctm_user_group_id || manualGroupId

        const ctmClient = new CTMClient()
        let allCalls: Awaited<ReturnType<CTMClient['calls']['getActiveCalls']>> = []

        try {
          allCalls = await ctmClient.calls.getActiveCalls()
        } catch {
          return NextResponse.json({ calls: [], meta: { assignedAgentId, assignedGroupId, isAdmin: false } })
        }

        let filteredCalls = allCalls

        if (assignedAgentId) {
          filteredCalls = allCalls.filter(call => {
            const aid = call.agent?.id
            return String(aid ?? '') === String(assignedAgentId)
          })
        } else if (assignedGroupId) {
          try {
            const userGroups = await ctmClient.agents.getUserGroups()
            const group = userGroups.find(g =>
              String(g.id) === String(assignedGroupId) ||
              g.name === String(assignedGroupId)
            )

            if (group) {
              filteredCalls = allCalls.filter(call => {
                if (!call.agent?.id) return false
                const agentUid = (call.agent as unknown as Record<string, unknown>)?.uid as number | undefined ?? Number(call.agent.id)
                return group.userIds.includes(agentUid)
              })
            }
          } catch {
            // group lookup failed, return unfiltered
          }
        }

        return NextResponse.json({
          calls: filteredCalls,
          meta: {
            assignedAgentId,
            assignedGroupId,
            isAdmin: false,
          }
        })
      }
    }

    const ctmClient = new CTMClient()
    const calls = await ctmClient.calls.getActiveCalls()

    return NextResponse.json({
      calls,
      meta: { isAdmin: true }
    })
  } catch (error) {
    console.error('Monitor active calls error:', error)
    return NextResponse.json({ error: 'Failed to fetch active calls', calls: [] }, { status: 500 })
  }
}
