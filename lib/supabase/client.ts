import { createBrowserClient } from '@supabase/ssr'

// Lazy singleton - only created on client side
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Always use browser client - it handles server-side gracefully
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client!')
    }

    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(key) {
          if (typeof document === 'undefined') return undefined
          const cookies = document.cookie.split(';')
          for (const cookie of cookies) {
            const [cookieKey, ...valueParts] = cookie.trim().split('=')
            if (cookieKey === key) {
              return valueParts.join('=')
            }
          }
          return undefined
        },
        set(key, value, options) {
          if (typeof document === 'undefined') return
          const opts = options ?? {}
          const expires = opts.expires ? `; expires=${opts.expires.toUTCString()}` : ''
          const path = opts.path ? `; path=${opts.path}` : '; path=/'
          const sameSite = opts.sameSite ? `; samesite=${opts.sameSite}` : '; samesite=lax'
          const secure = opts.secure ? '; secure' : ''
          document.cookie = `${key}=${value}${expires}${path}${sameSite}${secure}`
        },
        remove(key, options) {
          if (typeof document === 'undefined') return
          this.set(key, '', { ...options, expires: new Date(0) })
        },
      },
    })
  }

  // Multi-tab sync: listen for storage events from other tabs
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === 'sb-session' && !event.newValue) {
        // Session was cleared in another tab — sign out locally
        supabaseClient?.auth.signOut()
      }
    })
  }

  return supabaseClient
}

