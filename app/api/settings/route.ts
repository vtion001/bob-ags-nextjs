import { NextRequest } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function GET(request: NextRequest) {
  return proxyToLaravel('/settings', request)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  return proxyToLaravel('/settings', request, {
    method: 'POST',
    body,
  })
}

export async function DELETE(request: NextRequest) {
  return proxyToLaravel('/settings', request, {
    method: 'DELETE',
  })
}
