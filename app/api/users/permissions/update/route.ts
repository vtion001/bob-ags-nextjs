import { NextRequest } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function GET(request: NextRequest) {
  return proxyToLaravel('/users/permissions/update', request)
}

export async function PUT(request: NextRequest) {
  return proxyToLaravel('/users/permissions/update', request, 'PUT')
}
