import { NextRequest } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function POST(request: NextRequest) {
  const body = await request.json()
  return proxyToLaravel('/analyze', request, {
    method: 'POST',
    body,
  })
}
