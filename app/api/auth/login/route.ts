import { NextRequest, NextResponse } from 'next/server'
import { LARAVEL_API_URL } from '@/lib/api/proxy'

const LARAVEL_AUTH_URL = LARAVEL_API_URL.replace('/api', '')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Forward to Laravel auth endpoint
    const response = await fetch(`${LARAVEL_AUTH_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Login failed' },
        { status: response.status }
      )
    }

    // Return Laravel's response (includes access_token, user, etc.)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
