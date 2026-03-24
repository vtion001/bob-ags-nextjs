import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CTMClient } from '@/lib/ctm'
import type { Call } from '@/lib/types'
import { filterCallsByPhillies } from '@/lib/monitor/helpers'

const DEV_EMAIL = 'agsdev@allianceglobalsolutions.com'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const groupId = searchParams.get('groupId')
    const agentId = searchParams.get('agentId')
    const status = searchParams.get('status') || 'in_progress'
    const hours = parseInt(searchParams.get('hours') || '1', 10)

    const ctmClient = new CTMClient()
    
    let allCalls: Call[] = []
    try {
      allCalls = await ctmClient.calls.getCalls({ 
        limit: 50, 
        hours: Math.min(hours, 2160),
        status: status,
      })
      
      if (allCalls.length > 0) {
        console.log('[live-calls] Sample call agent data:', {
          firstCall: {
            id: allCalls[0].id,
            agent: allCalls[0].agent,
            source: allCalls[0].source,
          },
          secondCall: allCalls.length > 1 ? {
            id: allCalls[1].id,
            agent: allCalls[1].agent,
            source: allCalls[1].source,
          } : null,
        })
      }
    } catch (ctmError) {
      console.error('CTM API error:', ctmError)
      return NextResponse.json({
        calls: [],
        meta: { total: 0, error: 'CTM API error: ' + (ctmError instanceof Error ? ctmError.message : 'Unknown') }
      })
    }

    // Check admin status
    const isDevAdmin = user.email === DEV_EMAIL
    
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isAdmin = isDevAdmin || userRole?.role === 'admin'

    // Get CTM group assignments from user_settings
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('settings')
      .eq('user_id', user.id)
      .single()

    const settings = userSettings?.settings || {}
    const assignedGroupId = settings.ctm_user_group_id || groupId
    const assignedAgentId = settings.ctm_agent_id || agentId

    let filteredCalls: Call[] = allCalls

    if (!isAdmin) {
      // Filter by specific agent
      if (assignedAgentId) {
        filteredCalls = allCalls.filter(call => {
          const aid = call.agent?.id
          const aidStr = String(aid ?? '')
          const assignedStr = String(assignedAgentId)
          return aidStr === assignedStr
        })
      }
      // Filter by user group
      else if (assignedGroupId) {
        const userGroups = await ctmClient.agents.getUserGroups()
        const group = userGroups.find(g => 
          String(g.id) === String(assignedGroupId) ||
          g.name === String(assignedGroupId)
        )
        
        if (group) {
          filteredCalls = allCalls.filter(call => {
            if (!call.agent?.id) return false
            const agentUid = (call.agent as any).uid
            if (agentUid && group.userIds.includes(agentUid)) return true
            const agentIdStr = String(call.agent.id)
            return group.userIds.some(uid => String(uid) === agentIdStr)
          })
        }
      }
    }

    const uniqueCalls = filteredCalls.reduce((acc: Call[], call) => {
      if (!acc.find(c => c.id === call.id)) {
        acc.push(call)
      }
      return acc
    }, [])

    return NextResponse.json({
      calls: uniqueCalls,
      meta: {
        total: uniqueCalls.length,
        isAdmin,
        assignedGroupId: assignedGroupId || null,
        assignedAgentId: assignedAgentId || null,
        userEmail: user.email,
        status,
      }
    })
  } catch (error) {
    console.error('Live calls error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live calls', calls: [] },
      { status: 500 }
    )
  }
}
