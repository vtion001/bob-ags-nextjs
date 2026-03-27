import { NextRequest, NextResponse } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const phone = searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
  }

  const queryString = searchParams.toString()
  const endpoint = queryString ? `/ctm/calls/history?${queryString}` : '/ctm/calls/history'

  return proxyToLaravel(endpoint, request)
}