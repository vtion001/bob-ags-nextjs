import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { CTMClient } from '@/lib/ctm'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const hours = parseInt(searchParams.get('hours') || '24')
    const status = searchParams.get('status')
    const sourceId = searchParams.get('source_id')
    const agentId = searchParams.get('agent_id')

    const ctmClient = new CTMClient()
    const calls = await ctmClient.getCalls({ limit, hours, status, sourceId, agentId })

    return NextResponse.json({ calls })
  } catch (error) {
    console.error('CTM calls error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calls from CTM' },
      { status: 500 }
    )
  }
}