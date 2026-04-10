import { NextRequest, NextResponse } from 'next/server'
import { AgentsService } from '@/lib/ctm/services/agents'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const agentsService = new AgentsService()

    if (!agentsService.isConfigured()) {
      return NextResponse.json(
        { error: 'CTM not configured', data: [], user_groups: [] },
        { status: 200 }
      )
    }

    const groups = await agentsService.getUserGroups()

    return NextResponse.json({
      success: true,
      data: groups,
      user_groups: groups
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)

    if (
      message.includes('CTM credentials not configured') ||
      message.includes('CTM not configured')
    ) {
      return NextResponse.json(
        { error: 'CTM not configured', data: [], user_groups: [] },
        { status: 200 }
      )
    }

    if (
      message.includes('fetch failed') ||
      message.includes('ENOTFOUND') ||
      message.includes('ECONNREFUSED') ||
      message.includes('timeout') ||
      message.includes('network')
    ) {
      // CTM API is down - return empty array with 200, not 500
      return NextResponse.json(
        { success: true, data: [], user_groups: [] },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch agent groups from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
