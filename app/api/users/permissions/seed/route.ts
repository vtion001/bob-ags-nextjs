import { NextRequest } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function POST(request: NextRequest) {
  return proxyToLaravel('/users/permissions/seed', request, 'POST')
}
