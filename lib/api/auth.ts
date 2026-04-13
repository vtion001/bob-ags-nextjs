import { NextRequest, NextResponse } from 'next/server'
import { authApi } from '@/lib/laravel/api-client'

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
    const userData = await authApi.getUser()

    if (!userData.user) {
      return {
        user: null,
        error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      }
    }

    const isDevAdmin = userData.user.email === DEV_EMAIL
    const isAdmin = isDevAdmin || userData.role === 'admin'

    return {
      user: {
        id: userData.user.id,
        email: userData.user.email,
        isAdmin,
        role: userData.role,
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
  const { userApi } = await import('@/lib/laravel/api-client')
  const data = await userApi.getSettings()
  return data.settings || {}
}
