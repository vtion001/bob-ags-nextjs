import { NextRequest, NextResponse } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function POST(request: NextRequest) {
  return proxyToLaravel('/auth/logout', request, { method: 'POST' })
}
