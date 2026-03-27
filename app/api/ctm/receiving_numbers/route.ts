import { NextRequest } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

export async function GET(request: NextRequest) {
  return proxyToLaravel('/ctm/receiving_numbers', request)
}

export async function POST(request: NextRequest) {
  return proxyToLaravel('/ctm/receiving_numbers', request, 'POST')
}
