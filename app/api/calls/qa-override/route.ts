import { NextRequest } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function GET(request: NextRequest) {
  return proxyToLaravel('/calls/qa-override', request)
}

export async function POST(request: NextRequest) {
  return proxyToLaravel('/calls/qa-override', request, 'POST')
}
