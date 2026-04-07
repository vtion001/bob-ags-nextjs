import { NextResponse } from 'next/server'

export function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}
