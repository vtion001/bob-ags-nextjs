import { NextRequest, NextResponse } from 'next/server'
import { NumbersService } from '@/lib/ctm/services/numbers'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const numbersService = new NumbersService()
    const data = await numbersService.getNumbers()

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch numbers from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
