import { NextRequest, NextResponse } from 'next/server'
import { CallsService } from '@/lib/ctm/services/calls'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  try {
    const callsService = new CallsService()

    // Defensive: getActiveCalls() may return null if CTM returns an empty/non-JSON body.
    // Normalize to [] so downstream polling code never receives null.
    const raw = await callsService.getActiveCalls()
    const calls = Array.isArray(raw) ? raw : []

    return NextResponse.json({
      success: true,
      calls
    })
  } catch (error) {
    // Never throw 500 for CTM failures — degrade gracefully with empty array.
    // The monitor page polls this every few seconds; a 500 would trigger
    // auth errors / logout loops on the client.
    return NextResponse.json({
      success: true,
      calls: []
    })
  }
}

export async function POST(request: NextRequest) {
  const authError = await authenticate(request)
  if (authError) return authError

  // POST is not supported for active-calls - it's a read-only endpoint
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch active calls.' },
    { status: 405 }
  )
}
