import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { CTMClient } from '@/lib/ctm'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { phone_number, test } = body

    if (!phone_number) {
      return NextResponse.json(
        { error: 'phone_number is required' },
        { status: 400 }
      )
    }

    const ctmClient = new CTMClient()
    const data = await ctmClient.purchaseNumber(phone_number, test !== false)

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM purchase number error:', error)
    return NextResponse.json(
      { error: 'Failed to purchase number in CTM' },
      { status: 500 }
    )
  }
}
