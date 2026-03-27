import { NextRequest } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function POST(request: NextRequest) {
  const body = await request.json()
  return proxyToLaravel('/openrouter', request, {
    method: 'POST',
    body,
  })
}
