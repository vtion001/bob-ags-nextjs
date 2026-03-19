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
    const data = await ctmClient.getVoiceMenus()

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM voice menus error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch voice menus from CTM' },
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
    const { name, play_message, input_maxkeys, input_timeout, prompt_retries, items } = body

    const ctmClient = new CTMClient()
    const data = await ctmClient.createVoiceMenu({
      name,
      play_message,
      input_maxkeys,
      input_timeout,
      prompt_retries,
      items,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM create voice menu error:', error)
    return NextResponse.json(
      { error: 'Failed to create voice menu in CTM' },
      { status: 500 }
    )
  }
}
