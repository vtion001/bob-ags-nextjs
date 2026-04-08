import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'phone parameter is required' },
        { status: 400 }
      )
    }

    const { supabase, response } = await createServerSupabase(request)

    // Search calls by phone number using the RPC function
    const { data: calls, error } = await supabase
      .rpc('search_calls_by_phone', { p_phone: phone })

    if (error) {
      console.error('Supabase phone search error:', error)
      return NextResponse.json(
        { error: 'Failed to search calls in Supabase' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      calls: calls || [],
      source: 'supabase'
    })
  } catch (error) {
    console.error('Phone search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
