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
    const phone = searchParams.get('phone')
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const ctmClient = new CTMClient()
    
    const allCalls = await ctmClient.getCalls({ limit: 200, hours: 8760 })
    
    const inboundCalls = allCalls.filter(call => call.direction === 'inbound')
    
    const callerHistory = inboundCalls.filter(call => 
      call.phone.includes(phone) || call.callerNumber?.includes(phone)
    )
    
    callerHistory.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return NextResponse.json({ 
      phone,
      totalCalls: callerHistory.length,
      calls: callerHistory 
    })
  } catch (error) {
    console.error('CTM caller history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch caller history from CTM' },
      { status: 500 }
    )
  }
}