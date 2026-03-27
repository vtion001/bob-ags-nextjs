import { NextRequest, NextResponse } from 'next/server'
import { proxyToLaravel } from '@/lib/api/proxy'

// GET - Retrieve live analysis logs
export async function GET(request: NextRequest) {
  return proxyToLaravel('/live-analysis-logs', request)
}

// POST - Store a new live analysis log
export async function POST(request: NextRequest) {
  return proxyToLaravel('/live-analysis-logs', request, 'POST')
}

// DELETE - Clear all logs for a user
export async function DELETE(request: NextRequest) {
  return proxyToLaravel('/live-analysis-logs', request, 'DELETE')
}
