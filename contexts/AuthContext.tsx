'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// Supabase browser client singleton for auth error handling
const supabase = createClient()

export interface Permissions {
  can_view_calls: boolean
  can_view_monitor: boolean
  can_view_history: boolean
  can_view_agents: boolean
  can_manage_settings: boolean
  can_manage_users: boolean
  can_run_analysis: boolean
}

export interface Agent {
  id: string
  uid: number
  name: string
  email: string
}

export interface UserGroup {
  id: string
  name: string
  userIds: number[]
}

export interface AuthContextValue {
  email: string | null
  role: string
  permissions: Permissions
  isAdmin: boolean
  isViewer: boolean
  isAgent: boolean
  agents: Agent[]
  userGroups: UserGroup[]
  ctmAgentId: string | null
  isLoading: boolean
  isReady: boolean
  refetch: () => Promise<void>
}

const DEFAULT_PERMISSIONS: Permissions = {
  can_view_calls: true,
  can_view_monitor: true,
  can_view_history: false,
  can_view_agents: false,
  can_manage_settings: false,
  can_manage_users: false,
  can_run_analysis: false,
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [role, setRole] = useState<string>('viewer')
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS)
  const [agents, setAgents] = useState<Agent[]>([])
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [ctmAgentId, setCtmAgentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)
  const fetchCountRef = useRef(0)

  const fetchAll = useCallback(async () => {
    const currentFetch = ++fetchCountRef.current

    try {
      const [sessionRes, permsRes, agentsRes, groupsRes, settingsRes] = await Promise.all([
        fetch('/api/auth/session'),
        fetch('/api/users/permissions'),
        fetch('/api/ctm/agents'),
        fetch('/api/ctm/agents/groups'),
        fetch('/api/users/settings'),
      ])

      if (currentFetch !== fetchCountRef.current) return

      // Only redirect to login on 401 Unauthorized, not on backend errors
      if (sessionRes.status === 401) {
        window.location.href = '/'
        return
      }

      // For other errors (502, 503, 500, etc), don't redirect - backend may be temporarily unavailable
      if (!sessionRes.ok) {
        console.error('Session API error:', sessionRes.status, '- backend may be unavailable')
        // Set a reasonable loading state and let the UI handle the error gracefully
        if (currentFetch === fetchCountRef.current) {
          setIsLoading(false)
          setIsReady(true)
        }
        return
      }

      const sessionData = await sessionRes.json()
      setEmail(sessionData.email)

      if (permsRes.ok) {
        const permData = await permsRes.json()
        setRole(permData.role || 'viewer')
        setPermissions(permData.permissions || DEFAULT_PERMISSIONS)
      }

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json()
        setAgents(agentsData.agents || [])
        setUserGroups(agentsData.userGroups || [])
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        setCtmAgentId(settingsData.settings?.ctm_agent_id || null)
      }
    } catch (error) {
      console.error('Auth fetch failed:', error)
      // Network errors (CORS, DNS, etc) don't mean we're logged out
      // Backend is unreachable but user may still be authenticated via Supabase
      if (currentFetch === fetchCountRef.current) {
        setIsLoading(false)
        setIsReady(true)
      }
    } finally {
      if (currentFetch === fetchCountRef.current) {
        setIsLoading(false)
        setIsReady(true)
      }
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Handle Supabase browser client auto-refresh errors
  // When refresh token is invalid/expired, Supabase fires AUTH_ERROR
  // We catch it and redirect to login before the error propagates
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // AUTH_ERROR is not in the AuthChangeEvent type but Supabase fires it
      // when token refresh fails (e.g., revoked or expired refresh token)
      if ((event as string) === 'AUTH_ERROR') {
        console.warn('[Auth] Auth error detected, redirecting to login')
        window.location.href = '/'
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        email,
        role,
        permissions,
        isAdmin: role === 'admin',
        isViewer: role === 'viewer',
        isAgent: role === 'agent',
        agents,
        userGroups,
        ctmAgentId,
        isLoading,
        isReady,
        refetch: fetchAll,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
