import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

// Module-level cookie storage for capturing cookies set by supabase client
// This ensures cookies are available for redirect responses
const cookieStorage = new Map<string, { value: string; options?: CookieOptions }>()

export async function createServerSupabase(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
          // Also store in module-level map for backup access
          cookieStorage.set(name, { value, options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
          // Also remove from module-level map
          cookieStorage.delete(name)
        },
      },
    }
  )

  // Return object that can be destructured OR used directly as supabase client
  // When used as `const supabase = await createServerSupabase()` it acts like supabase
  // When used as `const { supabase, response } = await createServerSupabase()` both are available
  const result = {
    supabase,
    response,
    cookieStorage,
  }

  // Create a proxy so the result can be used directly as the supabase client
  // This maintains backward compatibility with existing code
  return new Proxy(result, {
    get(target, prop) {
      if (prop === 'supabase' || prop === 'response' || prop === 'cookieStorage') {
        return target[prop as keyof typeof target]
      }
      // Forward all other property accesses to the supabase client
      return (target.supabase as any)[prop as string]
    },
  }) as typeof supabase & { supabase: typeof supabase; response: typeof response; cookieStorage: Map<string, { value: string; options?: CookieOptions }> }
}