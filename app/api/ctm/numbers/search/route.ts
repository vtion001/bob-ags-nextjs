import { NextRequest, NextResponse } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  const endpoint = queryString ? `/ctm/numbers/search?${queryString}` : '/ctm/numbers/search'
  return proxyToLaravel(endpoint, request)
}
