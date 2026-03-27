import { NextRequest, NextResponse } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const callId = searchParams.get('callId')

  if (!callId) {
    return NextResponse.json({ error: 'callId is required' }, { status: 400 })
  }

  return proxyToLaravel(`/calls/${callId}/notes`, request)
}

export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { callId, notes } = body || {}

  if (!callId) {
    return NextResponse.json({ error: 'callId is required' }, { status: 400 })
  }

  return proxyToLaravel(`/calls/${callId}/notes`, request, {
    method: 'PATCH',
    body: { notes },
  })
}
