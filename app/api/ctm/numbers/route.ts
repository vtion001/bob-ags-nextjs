import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { CTMClient } from '@/lib/ctm'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ctmClient = new CTMClient()
    const data = await ctmClient.getNumbers()

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM numbers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch numbers from CTM' },
      { status: 500 }
    )
  }
}
