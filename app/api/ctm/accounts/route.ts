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
    const data = await ctmClient.getAccounts()

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM accounts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts from CTM' },
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
    const { name, timezoneHint } = body

    const ctmClient = new CTMClient()
    const data = await ctmClient.createAccount(name, timezoneHint)

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM create account error:', error)
    return NextResponse.json(
      { error: 'Failed to create account in CTM' },
      { status: 500 }
    )
  }
}
