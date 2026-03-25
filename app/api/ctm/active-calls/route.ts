import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getAuthenticatedUser, getUserSettings, getCTMClient } from '@/lib/api/deps'
import { fetchWithCache, invalidateCache } from '@/lib/api/cache'

const ADMIN_ACTIVE_CALLS_TTL = 2000
const VIEWER_ACTIVE_CALLS_TTL = 1000

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(request)
    if (error || !user) return error!

    const ctmClient = getCTMClient()
    
    const settings = await getUserSettings(request, user.id)
    const assignedAgentId = settings.ctm_agent_id
    const isViewer = !user.isAdmin && !!assignedAgentId
    
    const cacheKey = isViewer 
      ? `ctm:activeCalls:viewer:${assignedAgentId}`
      : 'ctm:activeCalls:admin'
    const cacheTtl = isViewer ? VIEWER_ACTIVE_CALLS_TTL : ADMIN_ACTIVE_CALLS_TTL

    const calls = await fetchWithCache(
      cacheKey,
      () => ctmClient.calls.getActiveCalls(),
      cacheTtl
    )

    if (user.isAdmin) {
      return NextResponse.json({ calls })
    }

    if (!assignedAgentId) {
      return NextResponse.json({ calls: [] })
    }

    const filteredCalls = calls.filter(call => {
      const aid = call.agent?.id
      const aidStr = String(aid ?? '')
      const assignedStr = String(assignedAgentId)
      return aidStr === assignedStr
    })

    return NextResponse.json({ calls: filteredCalls })
  } catch (error) {
    console.error('CTM active calls error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active calls from CTM' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  invalidateCache('ctm:activeCalls')
  return NextResponse.json({ success: true })
}
