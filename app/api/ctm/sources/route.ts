import { NextRequest, NextResponse } from 'next/server'
import { SourcesService } from '@/lib/ctm/services/sources'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const sourcesService = new SourcesService()
    const data = await sourcesService.getSources()

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sources from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const sourcesService = new SourcesService()
    const data = await sourcesService.createSource(body)

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create source in CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
