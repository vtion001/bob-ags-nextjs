import { NextRequest } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  const endpoint = queryString ? `/ctm/calls/analyze?${queryString}` : '/ctm/calls/analyze'

  return proxyToLaravel(endpoint, request)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  return proxyToLaravel('/ctm/calls/analyze', request, {
    method: 'POST',
    body,
  })
}
