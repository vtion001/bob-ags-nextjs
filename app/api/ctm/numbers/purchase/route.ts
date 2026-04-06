import { NextRequest, NextResponse } from 'next/server'
import { NumbersService } from '@/lib/ctm/services/numbers'
import { authenticate } from '@/lib/api-helpers'

export async function POST(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { phone_number, test = true } = body

    if (!phone_number) {
      return NextResponse.json(
        { error: 'phone_number is required' },
        { status: 400 }
      )
    }

    const numbersService = new NumbersService()
    const data = await numbersService.purchaseNumber(phone_number, test)

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to purchase number in CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
