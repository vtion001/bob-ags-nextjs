import { NextRequest, NextResponse } from 'next/server'
import { NumbersService } from '@/lib/ctm/services/numbers'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const searchParams = request.nextUrl.searchParams
    const numbersService = new NumbersService()

    const params: {
      country?: string
      searchby?: 'area' | 'address' | 'zip'
      areacode?: string
      address?: string
      pattern?: string
    } = {}

    const country = searchParams.get('country')
    if (country) params.country = country

    const searchby = searchParams.get('searchby') as 'area' | 'address' | 'zip' | null
    if (searchby) params.searchby = searchby

    const areacode = searchParams.get('areacode')
    if (areacode) params.areacode = areacode

    const address = searchParams.get('address')
    if (address) params.address = address

    const pattern = searchParams.get('pattern')
    if (pattern) params.pattern = pattern

    const data = await numbersService.searchNumbers(params)

    return NextResponse.json({
      success: true,
      ...data
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search numbers in CallTrackingMetrics' },
      { status: 502 }
    )
  }
}
