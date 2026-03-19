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
    const phone = searchParams.get('phone')

    const ctmClient = new CTMClient()
    let calls = await ctmClient.getCalls({ limit, hours, status, sourceId, agentId })

    const inboundCalls = calls.filter(call => call.direction === 'inbound')
    
    if (phone) {
      const filteredByPhone = inboundCalls.filter(call => 
        call.phone.includes(phone) || call.callerNumber?.includes(phone)
      )
      return NextResponse.json({ calls: filteredByPhone })
    }

    return NextResponse.json({ calls: inboundCalls })
  } catch (error) {
    console.error('CTM calls error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calls from CTM' },
      { status: 500 }
    )
  }
}