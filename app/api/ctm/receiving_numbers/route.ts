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
    const data = await ctmClient.getReceivingNumbers()

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM receiving numbers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch receiving numbers from CTM' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { number, name } = body

    if (!number) {
      return NextResponse.json(
        { error: 'number is required' },
        { status: 400 }
      )
    }

    const ctmClient = new CTMClient()
    const data = await ctmClient.createReceivingNumber(number, name || '')

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM create receiving number error:', error)
    return NextResponse.json(
      { error: 'Failed to create receiving number in CTM' },
      { status: 500 }
    )
  }
}
