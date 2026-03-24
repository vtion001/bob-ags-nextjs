import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getAuthenticatedUser, getCTMClient } from '@/lib/api/deps'
import { fetchWithCache } from '@/lib/api/cache'

const CACHE_TTL = 60000

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getAuthenticatedUser(request)
    if (error || !user) return error!

    const ctmClient = getCTMClient()

    const [agents, userGroups] = await Promise.all([
      fetchWithCache(
        `ctm:agents:${user.id}`,
        () => ctmClient.agents.getAgents(),
        CACHE_TTL
      ),
      fetchWithCache(
        `ctm:userGroups:${user.id}`,
        () => ctmClient.agents.getUserGroups(),
        CACHE_TTL
      ),
    ])

    return NextResponse.json({ agents, userGroups })
  } catch (error) {
    console.error('CTM agents error:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}