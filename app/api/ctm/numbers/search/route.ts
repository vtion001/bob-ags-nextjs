import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { CTMClient } from '@/lib/ctm'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const country = searchParams.get('country') || 'US'
    const searchby = searchParams.get('searchby') as 'area' | 'address' | 'zip' | null
    const areacode = searchParams.get('areacode')
    const address = searchParams.get('address')
    const pattern = searchParams.get('pattern')

    const ctmClient = new CTMClient()
    const data = await ctmClient.searchNumbers({
      country,
      searchby: searchby || undefined,
      areacode: areacode || undefined,
      address: address || undefined,
      pattern: pattern || undefined,
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('CTM search numbers error:', error)
    return NextResponse.json(
      { error: 'Failed to search numbers in CTM' },
      { status: 500 }
    )
  }
}
