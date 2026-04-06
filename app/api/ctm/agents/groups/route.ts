import { NextRequest, NextResponse } from 'next/server'
import { AgentsService } from '@/lib/ctm/services/agents'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const agentsService = new AgentsService()
    const groups = await agentsService.getUserGroups()

    return NextResponse.json({
      success: true,
      data: groups,
      user_groups: groups
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch agent groups from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
