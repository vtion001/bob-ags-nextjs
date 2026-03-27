import { NextRequest, NextResponse } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function GET(request: NextRequest) {
  // Forward query params to Laravel
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  const endpoint = queryString ? `/ctm/calls?${queryString}` : '/ctm/calls'

  return proxyToLaravel(endpoint, request)
}