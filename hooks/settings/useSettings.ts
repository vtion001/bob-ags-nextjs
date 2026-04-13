import { useState, useEffect, useCallback } from 'react'
import { userApi, ctmApi } from '@/lib/laravel/api-client'
import {
  CTMAssignment,
  UserSettings,
  UserRole,
  CurrentUser,
  CTMAgent,
  CTMUserGroup,
  RoleType,
  UserPermissions,
  DEFAULT_SETTINGS,
  DEFAULT_PERMISSIONS,
} from '@/lib/settings/types'

interface UseSettingsReturn {
  settings: UserSettings
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>
  isLoading: boolean
  isSaving: boolean
  saveMessage: string
  error: string
  currentUser: CurrentUser | null
  users: UserRole[]
  isAdmin: boolean
  showAddUser: boolean
  setShowAddUser: (show: boolean) => void
  newUserEmail: string
  setNewUserEmail: (email: string) => void
  newUserRole: RoleType
  setNewUserRole: (role: RoleType) => void
  ctmAssignments: CTMAssignment[]
  ctmAgents: CTMAgent[]
  ctmUserGroups: CTMUserGroup[]
  editingAssignment: string | null
  setEditingAssignment: (id: string | null) => void
  assignmentForm: { ctmAgentId: string; ctmUserGroupId: string }
  setAssignmentForm: React.Dispatch<React.SetStateAction<{ ctmAgentId: string; ctmUserGroupId: string }>>
  assignmentSaving: boolean
  loadSettings: () => Promise<void>
  handleSave: () => Promise<void>
  handleClearCredentials: () => Promise<void>
  handleAddUser: () => Promise<void>
  handleUpdateRole: (userId: string, role: RoleType) => Promise<void>
  handleApproveUser: (userId: string, role: RoleType) => Promise<void>
  handleRejectUser: (userId: string) => Promise<void>
  handleSaveCTMAssignment: (userId: string) => Promise<void>
  startEditAssignment: (assignment: CTMAssignment) => void
  cancelEditAssignment: () => void
  getAgentName: (id: string | null) => string
  getGroupName: (id: string | null) => string
  clearSaveMessage: () => void
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [users, setUsers] = useState<UserRole[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState<RoleType>('viewer')

  const [ctmAssignments, setCtmAssignments] = useState<CTMAssignment[]>([])
  const [ctmAgents, setCtmAgents] = useState<CTMAgent[]>([])
  const [ctmUserGroups, setCtmUserGroups] = useState<CTMUserGroup[]>([])
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null)
  const [assignmentForm, setAssignmentForm] = useState({ ctmAgentId: '', ctmUserGroupId: '' })
  const [assignmentSaving, setAssignmentSaving] = useState(false)

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const [settingsRes, permsRes] = await Promise.all([
        userApi.getSettings().catch(() => ({ settings: DEFAULT_SETTINGS })),
        userApi.getPermissions().catch(() => ({ role: 'viewer', permissions: DEFAULT_PERMISSIONS })),
      ])

      if (settingsRes.settings) {
        setSettings(prev => ({ ...prev, ...settingsRes.settings }))
      }

      setCurrentUser({
        role: permsRes.role || 'viewer',
        permissions: (permsRes.permissions as unknown as UserPermissions) || DEFAULT_PERMISSIONS['viewer'],
        email: ''
      })
      setIsAdmin(permsRes.role === 'admin')

      if (permsRes.role === 'admin') {
        const [ctmRes, agentsRes, groupsRes] = await Promise.all([
          userApi.getCtmAssignments().catch(() => ({ assignments: [] })),
          ctmApi.getAgents().catch(() => ({ agents: [] })),
          ctmApi.getAgentGroups().catch(() => ({ userGroups: [] })),
        ])

        setCtmAssignments((ctmRes.assignments || []) as CTMAssignment[])
        setCtmAgents((agentsRes.agents || []) as CTMAgent[])
        setCtmUserGroups((groupsRes.userGroups || []) as CTMUserGroup[])
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      await userApi.updateSettings({
        ctm_agent_id: settings.ctm_agent_id || undefined,
        theme: settings.theme || undefined,
        notifications_enabled: settings.notifications_enabled,
      })
      setSaveMessage('Settings saved successfully')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearCredentials = async () => {
    if (!confirm('Are you sure you want to clear all credentials? This cannot be undone.')) {
      return
    }

    setIsSaving(true)
    try {
      await userApi.updateSettings({
        ctm_agent_id: '',
        theme: 'dark',
        notifications_enabled: true,
      })
      setSettings(DEFAULT_SETTINGS)
      setSaveMessage('Credentials cleared')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to clear settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUserEmail) return

    setIsSaving(true)
    try {
      const permissions = DEFAULT_PERMISSIONS[newUserRole]
      // Note: User creation via admin is not yet implemented in Laravel
      setSaveMessage('User creation via admin panel coming soon')
      setShowAddUser(false)
      setNewUserEmail('')
      setNewUserRole('viewer')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateRole = async (userId: string, role: RoleType) => {
    setIsSaving(true)
    try {
      // Note: Role update via admin is not yet implemented in Laravel
      setSaveMessage('Role update coming soon')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setIsSaving(false)
    }
  }

  const handleApproveUser = async (userId: string, role: RoleType) => {
    setIsSaving(true)
    try {
      setSaveMessage('User approval coming soon')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRejectUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this user? This will remove their access.')) {
      return
    }

    setIsSaving(true)
    try {
      setSaveMessage('User rejection coming soon')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject user')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCTMAssignment = async (userId: string) => {
    setAssignmentSaving(true)
    try {
      // Note: CTM assignment update via admin is not yet implemented in Laravel
      setSaveMessage('CTM assignment update coming soon')
      setEditingAssignment(null)
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save CTM assignment')
    } finally {
      setAssignmentSaving(false)
    }
  }

  const startEditAssignment = (assignment: CTMAssignment) => {
    setEditingAssignment(assignment.userId)
    setAssignmentForm({
      ctmAgentId: assignment.ctmAgentId || '',
      ctmUserGroupId: assignment.ctmUserGroupId || '',
    })
  }

  const cancelEditAssignment = () => {
    setEditingAssignment(null)
    setAssignmentForm({ ctmAgentId: '', ctmUserGroupId: '' })
  }

  const getAgentName = (id: string | null) => {
    if (!id) return '—'
    const agent = ctmAgents.find(a => a.id === id)
    return agent ? agent.name : id
  }

  const getGroupName = (id: string | null) => {
    if (!id) return '—'
    const group = ctmUserGroups.find(g => g.id === id)
    return group ? group.name : id
  }

  const clearSaveMessage = () => setSaveMessage('')

  return {
    settings,
    setSettings,
    isLoading,
    isSaving,
    saveMessage,
    error,
    currentUser,
    users,
    isAdmin,
    showAddUser,
    setShowAddUser,
    newUserEmail,
    setNewUserEmail,
    newUserRole,
    setNewUserRole,
    ctmAssignments,
    ctmAgents,
    ctmUserGroups,
    editingAssignment,
    setEditingAssignment,
    assignmentForm,
    setAssignmentForm,
    assignmentSaving,
    loadSettings,
    handleSave,
    handleClearCredentials,
    handleAddUser,
    handleUpdateRole,
    handleApproveUser,
    handleRejectUser,
    handleSaveCTMAssignment,
    startEditAssignment,
    cancelEditAssignment,
    getAgentName,
    getGroupName,
    clearSaveMessage,
  }
}
