import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CTMAssignment,
  UserSettings,
  UserRole,
  CurrentUser,
  CTMAgent,
  CTMUserGroup,
  RoleType,
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

  const supabase = createClient()

  const loadSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const [settingsRes, permissionsRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/users/permissions')
      ])
      
      if (settingsRes.ok) {
        const data = await settingsRes.json()
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
        }
      }
      
      if (permissionsRes.ok) {
        const permData = await permissionsRes.json()
        setCurrentUser({ 
          role: permData.role, 
          permissions: permData.permissions,
          email: permData.email 
        })
        setIsAdmin(permData.role === 'admin')
        
        if (permData.role === 'admin') {
          const [usersRes, ctmRes] = await Promise.all([
            fetch('/api/users/permissions/update'),
            fetch('/api/users/ctm-assignments'),
          ])
          
          if (usersRes.ok) {
            const usersData = await usersRes.json()
            const allUsers = [...(usersData.roles || [])]
            if (permData.email !== 'agsdev@allianceglobalsolutions.com' && !allUsers.find(u => u.email === 'agsdev@allianceglobalsolutions.com')) {
              allUsers.unshift({
                id: 'dev-admin',
                user_id: 'agsdev@allianceglobalsolutions.com',
                email: 'agsdev@allianceglobalsolutions.com',
                role: 'admin',
                permissions: DEFAULT_PERMISSIONS.admin,
                created_at: new Date().toISOString(),
              })
            }
            setUsers(allUsers)
          }
          
          if (ctmRes.ok) {
            const ctmData = await ctmRes.json()
            setCtmAssignments(ctmData.assignments || [])
          }

          // Fetch CTM agents and user groups from their respective endpoints
          const [agentsRes, groupsRes] = await Promise.all([
            fetch('/api/ctm/agents'),
            fetch('/api/ctm/agents/groups'),
          ])

          if (agentsRes.ok) {
            const agentsData = await agentsRes.json()
            setCtmAgents(agentsData.agents || agentsData.data || [])
          }

          if (groupsRes.ok) {
            const groupsData = await groupsRes.json()
            setCtmUserGroups(groupsData.user_groups || groupsData.data || [])
          }
        }
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
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      
      if (!res.ok) throw new Error('Failed to save settings')
      
      setSaveMessage('Settings saved successfully')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
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
      const res = await fetch('/api/settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!res.ok) throw new Error('Failed to clear settings')
      
      setSettings(DEFAULT_SETTINGS)
      setSaveMessage('Credentials cleared')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddUser = async () => {
    if (!newUserEmail) return
    
    setIsSaving(true)
    try {
      const permissions = DEFAULT_PERMISSIONS[newUserRole]
      const res = await fetch('/api/users/permissions/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: newUserEmail,
          email: newUserEmail,
          role: newUserRole,
          permissions,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to add user')
      
      setSaveMessage('User added successfully')
      setShowAddUser(false)
      setNewUserEmail('')
      setNewUserRole('viewer')
      
      const usersRes = await fetch('/api/users/permissions/update')
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.roles || [])
      }
      
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateRole = async (userId: string, role: RoleType) => {
    setIsSaving(true)
    try {
      const permissions = DEFAULT_PERMISSIONS[role]
      const user = users.find(u => u.user_id === userId)
      
      const res = await fetch('/api/users/permissions/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          email: user?.email || userId,
          role,
          permissions,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to update role')
      
      setUsers(users.map(u => 
        u.user_id === userId 
          ? { ...u, role, permissions }
          : u
      ))
      
      setSaveMessage('Role updated successfully')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleApproveUser = async (userId: string, role: RoleType) => {
    setIsSaving(true)
    try {
      const permissions = DEFAULT_PERMISSIONS[role]
      const user = users.find(u => u.user_id === userId)
      
      const res = await fetch('/api/users/permissions/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          email: user?.email || userId,
          role: role,
          permissions: permissions,
          approved: true,
          approvedBy: currentUser?.email,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to approve user')
      
      setUsers(users.map(u => 
        u.user_id === userId 
          ? { ...u, role, approved: true, approved_by: currentUser?.email || '' }
          : u
      ))
      
      setSaveMessage('User approved successfully')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
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
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
      
      if (error) throw error
      
      setUsers(users.filter(u => u.user_id !== userId))
      
      setSaveMessage('User rejected and removed')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCTMAssignment = async (userId: string) => {
    setAssignmentSaving(true)
    try {
      const res = await fetch('/api/users/ctm-assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          ctmAgentId: assignmentForm.ctmAgentId || null,
          ctmUserGroupId: assignmentForm.ctmUserGroupId || null,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to save CTM assignment')
      
      setCtmAssignments(prev => prev.map(a => 
        a.userId === userId 
          ? { ...a, ctmAgentId: assignmentForm.ctmAgentId || null, ctmUserGroupId: assignmentForm.ctmUserGroupId || null }
          : a
      ))
      setEditingAssignment(null)
      setSaveMessage('CTM assignment saved')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
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
