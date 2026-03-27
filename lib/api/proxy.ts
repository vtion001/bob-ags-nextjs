import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const LARAVEL_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export interface LaravelErrorResponse {
  success: false
  error: string
}

export interface LaravelSuccessResponse<T = any> {
  success: true
  data: T
}

export type LaravelResponse<T = any> = LaravelErrorResponse | LaravelSuccessResponse<T>

export async function getSupabaseToken(request: NextRequest): Promise<string | null> {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || null
  } catch (error) {
    console.error('Error getting Supabase session:', error)
    return null
  }
}

export async function proxyToLaravel<T = any>(
  endpoint: string,
  request: NextRequest,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: any
    timeout?: number
  } = {}
): Promise<NextResponse> {
  const { method = 'GET', body, timeout = 30000 } = options

  try {
    const token = await getSupabaseToken(request)

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid session' },
        { status: 401 }
      )
    }

    const url = `${LARAVEL_API_URL}${endpoint}`
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    // Forward cookies for Supabase auth (Laravel may need these)
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
    }

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body)
    }

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    fetchOptions.signal = controller.signal

    const response = await fetch(url, fetchOptions)
    clearTimeout(timeoutId)

    // Get raw text first to check content type
    const rawText = await response.text()

    // Try to parse as JSON, fallback to error message
    let data: any
    try {
      data = JSON.parse(rawText)
    } catch {
      // If Laravel returned HTML error page, extract error message
      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('text/html')) {
        console.error(`Laravel API returned HTML (${response.status}) for ${endpoint}:`, rawText.substring(0, 200))
        return NextResponse.json(
          { error: `Laravel API error: ${response.status} - Backend service error` },
          { status: 502 }
        )
      }
      // For other content types, try to extract any JSON-like content
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          data = JSON.parse(jsonMatch[0])
        } catch {
          data = { error: rawText.substring(0, 200) }
        }
      } else {
        data = { error: rawText.substring(0, 200) }
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || `Laravel API error: ${response.status}` },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error(`Proxy to Laravel error [${endpoint}]:`, error)

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request to Laravel API timed out' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: `Failed to connect to Laravel API: ${error.message}` },
      { status: 502 }
    )
  }
}

export { LARAVEL_API_URL }
