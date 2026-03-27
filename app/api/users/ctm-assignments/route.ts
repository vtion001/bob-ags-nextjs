import { NextRequest, NextResponse } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function GET(request: NextRequest) {
  return proxyToLaravel('/users/ctm-assignments', request)
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  return proxyToLaravel('/users/ctm-assignments', request, {
    method: 'PUT',
    body,
  })
}
