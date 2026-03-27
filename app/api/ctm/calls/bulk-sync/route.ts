import { NextRequest, NextResponse } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function GET(request: NextRequest) {
  return proxyToLaravel('/ctm/calls/bulk-sync', request)
}

export async function POST(request: NextRequest) {
  return proxyToLaravel('/ctm/calls/bulk-sync', request, { method: 'POST' })
}
