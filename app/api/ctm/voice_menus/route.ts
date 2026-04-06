import { NextRequest, NextResponse } from 'next/server'
import { VoiceMenusService } from '@/lib/ctm/services/voiceMenus'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const voiceMenusService = new VoiceMenusService()
    const data = await voiceMenusService.getVoiceMenus()

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch voice menus from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const voiceMenusService = new VoiceMenusService()
    const data = await voiceMenusService.createVoiceMenu(body)

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create voice menu in CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
