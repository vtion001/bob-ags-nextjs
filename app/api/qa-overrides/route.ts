import { NextRequest, NextResponse } from 'next/server'
import { callsApi, qaOverrideApi } from '@/lib/laravel/api-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '25', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const data = await callsApi.getCalls({ limit, hours: 8760 })

    const calls = (data.calls || []).filter((c: any) => c.score != null)
    const total = calls.length

    return NextResponse.json({
      success: true,
      calls,
      total
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      calls: [],
      total: 0
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.call_id || body.score === undefined) {
      return NextResponse.json(
        { error: 'call_id and score are required' },
        { status: 400 }
      )
    }

    const result = await qaOverrideApi.createOverride({
      call_id: body.call_id,
      score: body.score,
      notes: body.notes,
    })

    return NextResponse.json({
      success: true,
      qa_override: result.override
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create QA override' },
      { status: 500 }
    )
  }
}
