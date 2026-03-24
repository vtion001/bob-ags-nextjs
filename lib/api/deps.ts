import { createServerSupabase } from '@/lib/supabase/server'
import { CTMClient } from '@/lib/ctm'
import { NextRequest } from 'next/server'

const DEV_EMAIL = 'agsdev@allianceglobalsolutions.com'

export interface AuthenticatedUser {
  id: string
  email: string
  isAdmin: boolean
  role: string
}

export async function getAuthenticatedUser(request: NextRequest): Promise<{
  user: AuthenticatedUser | null
  error: Response | null
}> {
  try {
    const supabase = await createServerSupabase(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        user: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    const isDevAdmin = user.email === DEV_EMAIL

    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    const isAdmin = isDevAdmin || userRole?.role === 'admin'

    return {
      user: {
        id: user.id,
        email: user.email || '',
        isAdmin,
        role: userRole?.role || 'viewer',
      },
      error: null,
    }
  } catch (error) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Authentication failed' }, { status: 500 }),
    }
  }
}

let ctmClientInstance: CTMClient | null = null

export function getCTMClient(): CTMClient {
  if (!ctmClientInstance) {
    ctmClientInstance = new CTMClient()
  }
  return ctmClientInstance
}

import { NextResponse } from 'next/server'

export async function requireAdmin(request: NextRequest): Promise<{
  user: AuthenticatedUser | null
  error: Response | null
}> {
  const { user, error } = await getAuthenticatedUser(request)

  if (error || !user) {
    return { user: null, error: error || NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (!user.isAdmin) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user, error: null }
}

export async function getUserSettings(request: NextRequest, userId: string) {
  const supabase = await createServerSupabase(request)
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .single()

  return userSettings?.settings || {}
}

export function createErrorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export async function fetchAllCTMData<T>(
  fetchFns: Array<() => Promise<T>>,
  ttlMs: number = 30000
): Promise<T[]> {
  const { fetchWithCache } = await import('@/lib/api/cache')
  const ctmClient = getCTMClient()

  const promises = fetchFns.map((fetchFn, index) =>
    fetchWithCache(
      `ctm:parallel:${index}`,
      fetchFn,
      ttlMs
    )
  )

  return Promise.all(promises)
}