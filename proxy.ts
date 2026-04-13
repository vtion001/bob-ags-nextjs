import { NextResponse, type NextRequest } from 'next/server'

// Laravel Sanctum uses httpOnly cookies - no need for complex middleware
// The browser automatically sends cookies with each request
// Laravel validates the session cookie on protected routes

export default async function middleware(request: NextRequest) {
  // For Laravel API calls, the session cookie is sent automatically by the browser
  // No need to manually set or refresh tokens like with Supabase

  // If accessing dashboard without a session cookie, let the page load
  // The AuthContext will handle showing the login state
  const response = NextResponse.next()

  // Add CORS headers for Laravel API requests during development
  const isLocalhost = request.headers.get('host')?.includes('localhost')
  if (isLocalhost) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || 'http://localhost:3000')
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
