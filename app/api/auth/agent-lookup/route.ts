import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CallsService } from '@/lib/ctm/services/calls'

const DEV_BYPASS_UID = '00000000-0000-0000-0000-000000000001'

export async function POST(request: NextRequest) {
  try {
    const devSessionCookie = request.cookies.get('sb-dev-session')
    let isDevUser = false
    if (devSessionCookie) {
      try {
        const devSession = JSON.parse(devSessionCookie.value)
        if (devSession.dev && devSession.user?.id === DEV_BYPASS_UID) {
          isDevUser = true
        }
      } catch {}
    }

    if (!isDevUser) {
      const { supabase } = await createServerSupabase(request)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json(
        { error: 'phone is required' },
        { status: 400 }
      )
    }

    // Search for the phone number in recent calls to find the agent
    const callsService = new CallsService()
    const calls = await callsService.searchCallsByPhone(phone, 8760)

    if (calls.length === 0) {
      return NextResponse.json({
        success: true,
        agent: null,
        message: 'No agent found for this phone number'
      })
    }

    // Get unique agents from calls
    const agentMap = new Map<string, { id: string; name: string; email: string }>()
    for (const call of calls) {
      if (call.agent) {
        agentMap.set(call.agent.id, {
          id: call.agent.id,
          name: call.agent.name || 'Unknown',
          email: call.agent.email || ''
        })
      }
    }

    const agents = Array.from(agentMap.values())

    return NextResponse.json({
      success: true,
      agents,
      callCount: calls.length
    })
  } catch (error) {
    console.error('Agent lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to lookup agent' },
      { status: 500 }
    )
  }
}
