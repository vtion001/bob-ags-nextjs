import { NextRequest, NextResponse } from 'next/server'
import { ReceivingNumbersService } from '@/lib/ctm/services/receivingNumbers'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const receivingNumbersService = new ReceivingNumbersService()
    const data = await receivingNumbersService.getReceivingNumbers()

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch receiving numbers from CallTrackingMetrics' },
      { status: 502 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const body = await request.json()
    const { number, name } = body

    if (!number || !name) {
      return NextResponse.json(
        { error: 'number and name are required' },
        { status: 400 }
      )
    }

    const receivingNumbersService = new ReceivingNumbersService()
    const data = await receivingNumbersService.createReceivingNumber(number, name)

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create receiving number in CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
