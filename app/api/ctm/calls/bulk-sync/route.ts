import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const authError = await authenticate(request)
    if (authError) return authError

    // Bulk sync is a no-op in standalone mode - returns empty result
    return NextResponse.json({
      success: true,
      synced: 0,
      message: 'Bulk sync completed (no-op in standalone mode)'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to perform bulk sync' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await authenticate(request)
    if (authError) return authError

    // Bulk sync is a no-op in standalone mode - returns empty result
    return NextResponse.json({
      success: true,
      synced: 0,
      message: 'Bulk sync completed (no-op in standalone mode)'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to perform bulk sync' },
      { status: 500 }
    )
  }
}
