import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/?error=oauth_not_supported', request.url))
}
