'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { authApi, userApi, ctmApi } from '@/lib/laravel/api-client'

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
  isAuthenticated: boolean
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
      // Fetch user, permissions, agents, and settings in parallel
      const [userRes, permsRes, agentsRes, settingsRes] = await Promise.all([
        authApi.getUser(),
        userApi.getPermissions(),
        ctmApi.getAgents(),
        userApi.getSettings(),
      ])

      if (currentFetch !== fetchCountRef.current) return

      setEmail(userRes.user?.email ?? null)
      setRole(userRes.role || 'viewer')
      setPermissions((userRes.permissions as unknown as Permissions) || DEFAULT_PERMISSIONS)

      if (agentsRes.agents) {
        setAgents(agentsRes.agents as Agent[])
      }

      // Extract user groups from agents response
      if (agentsRes.userGroups) {
        setUserGroups(agentsRes.userGroups as UserGroup[])
      }

      if (settingsRes.settings?.ctm_agent_id) {
        setCtmAgentId(settingsRes.settings.ctm_agent_id)
      }
    } catch (error) {
      console.error('Auth fetch failed:', error)
      // Network errors or 401 mean we're not authenticated
      if (currentFetch === fetchCountRef.current) {
        setEmail(null)
        setRole('viewer')
        setPermissions(DEFAULT_PERMISSIONS)
        setAgents([])
        setUserGroups([])
        setCtmAgentId(null)
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
        isAuthenticated: !!email,
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
