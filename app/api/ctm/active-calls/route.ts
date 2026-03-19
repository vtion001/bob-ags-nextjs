import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { CTMClient } from '@/lib/ctm'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ctmClient = new CTMClient()
    const calls = await ctmClient.getActiveCalls()

    return NextResponse.json({ calls })
  } catch (error) {
    console.error('CTM active calls error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active calls from CTM' },
      { status: 500 }
    )
  }
}