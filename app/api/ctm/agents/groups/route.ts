import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function GET(request: NextRequest) {
  return proxyToLaravel('/ctm/agents/groups', request)
}