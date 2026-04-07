import React, { useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { UserRole, RoleType } from '@/lib/settings/types'

const ROLE_COLORS: Record<RoleType, { bg: string; text: string; label: string }> = {
  admin: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Admin' },
  manager: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Manager' },
  qa: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'QA' },
  viewer: { bg: 'bg-navy-100', text: 'text-navy-700', label: 'Viewer' },
  agent: { bg: 'bg-green-100', text: 'text-green-700', label: 'Agent' },
}

const ROLE_DESCRIPTIONS: Record<RoleType, string> = {
  admin: 'Full access to all features',
  manager: 'Access to calls, monitor, history, and analysis',
  qa: 'View all calls, history, and run analysis',
  viewer: 'Monitor tab only',
  agent: 'Monitor assigned calls only',
}

interface UserCardProps {
  user: UserRole
  isDevAdmin?: boolean
  isPending?: boolean
  onApprove?: (role: RoleType) => void
  onReject?: () => void
  onRoleChange?: (role: RoleType) => void
  isSaving?: boolean
}

function UserCard({ user, isDevAdmin, isPending, onApprove, onReject, onRoleChange, isSaving }: UserCardProps) {
  const [selectedRole, setSelectedRole] = useState<RoleType>(user.role || 'viewer')
  const roleColors = ROLE_COLORS[user.role || 'viewer']

  if (isDevAdmin) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl bg-navy-50 border border-navy-200">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-navy-900">{user.email}</p>
              <span className="px-2 py-0.5 text-xs font-semibold bg-navy-900 text-white rounded-full">
                Admin
              </span>
            </div>
            <p className="text-sm text-navy-500">{ROLE_DESCRIPTIONS.admin}</p>
          </div>
        </div>
        <span className="px-4 py-2 text-sm font-semibold text-navy-700 bg-navy-200 rounded-lg">
          Full Access
        </span>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-navy-900">{user.email}</p>
              <p className="text-sm text-amber-600">Awaiting approval</p>
            </div>
          </div>
          <button
            onClick={onReject}
            disabled={isSaving}
            className="p-2 text-navy-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Reject"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as RoleType)}
            className="flex-1 px-3 py-2 rounded-lg border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
          >
            <option value="viewer">Viewer - Monitor only</option>
            <option value="agent">Agent - Monitor assigned calls</option>
            <option value="qa">QA - View calls & analysis</option>
            <option value="manager">Manager - Full access (no settings)</option>
            <option value="admin">Admin - Full access</option>
          </select>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onApprove?.(selectedRole)}
            isLoading={isSaving}
          >
            Approve
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-navy-50/50 border border-navy-100 hover:border-navy-200 hover:bg-navy-50 transition-all">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center">
          <span className="text-navy-700 font-semibold text-sm">
            {user.email.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-navy-900">{user.email}</p>
            <span className={`px-2 py-0.5 text-xs font-semibold ${roleColors.bg} ${roleColors.text} rounded-full`}>
              {roleColors.label}
            </span>
          </div>
          <p className="text-sm text-navy-500">{ROLE_DESCRIPTIONS[user.role || 'viewer']}</p>
        </div>
      </div>
      <select
        value={user.role}
        onChange={(e) => onRoleChange?.(e.target.value as RoleType)}
        disabled={isSaving}
        className="px-3 py-2 rounded-lg border border-navy-200 bg-white text-navy-900 text-sm focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 hover:border-navy-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <option value="viewer">Viewer</option>
        <option value="agent">Agent</option>
        <option value="qa">QA</option>
        <option value="manager">Manager</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  )
}

interface UserPermissionsCardProps {
  users: UserRole[]
  showAddUser: boolean
  setShowAddUser: (show: boolean) => void
  newUserEmail: string
  setNewUserEmail: (email: string) => void
  newUserRole: RoleType
  setNewUserRole: (role: RoleType) => void
  isSaving: boolean
  onAddUser: () => Promise<void>
  onUpdateRole: (userId: string, role: RoleType) => Promise<void>
  onApproveUser: (userId: string, role: RoleType) => Promise<void>
  onRejectUser: (userId: string) => Promise<void>
}

export default function UserPermissionsCard({
  users,
  showAddUser,
  setShowAddUser,
  newUserEmail,
  setNewUserEmail,
  newUserRole,
  setNewUserRole,
  isSaving,
  onAddUser,
  onUpdateRole,
  onApproveUser,
  onRejectUser,
}: UserPermissionsCardProps) {
  const pendingUsers = users.filter(u => !u.approved && u.email !== 'agsdev@allianceglobalsolutions.com' && u.id !== 'dev-admin')
  const approvedUsers = users.filter(u => u.approved || u.email === 'agsdev@allianceglobalsolutions.com' || u.id === 'dev-admin')

  return (
    <Card className="p-6 mb-6 border-navy-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-navy-900">User Permissions</h2>
          <p className="text-sm text-navy-500 mt-0.5">Manage user roles and access levels</p>
        </div>
        <Button
          variant={showAddUser ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => setShowAddUser(!showAddUser)}
        >
          {showAddUser ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add User
            </span>
          )}
        </Button>
      </div>

      {showAddUser && (
        <div className="mb-6 p-5 bg-navy-50/50 border border-navy-100 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="user@company.com"
            />
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-2">Role</label>
              <select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value as RoleType)}
                className="w-full px-3 py-2.5 rounded-lg border border-navy-200 bg-white text-navy-900 focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20"
              >
                <option value="viewer">Viewer - Monitor only</option>
                <option value="qa">QA - View calls & analysis</option>
                <option value="manager">Manager - Full access (no settings)</option>
                <option value="admin">Admin - Full access</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="primary"
                size="md"
                onClick={onAddUser}
                isLoading={isSaving}
                className="w-full"
              >
                Add User
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {pendingUsers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-600 text-xs font-bold">{pendingUsers.length}</span>
              </div>
              <h3 className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
                Pending Approval
              </h3>
            </div>
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isPending
                  onApprove={(role) => onApproveUser(user.user_id, role)}
                  onReject={() => onRejectUser(user.user_id)}
                  isSaving={isSaving}
                />
              ))}
            </div>
          </div>
        )}
        
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-navy-100 flex items-center justify-center">
              <span className="text-navy-600 text-xs font-bold">{approvedUsers.length}</span>
            </div>
            <h3 className="text-sm font-semibold text-navy-700 uppercase tracking-wide">
              Approved Users
            </h3>
          </div>
          
          {approvedUsers.length === 0 && !pendingUsers.length ? (
            <div className="text-center py-8 px-4 bg-navy-50/50 rounded-xl border border-dashed border-navy-200">
              <svg className="w-12 h-12 text-navy-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-navy-500 font-medium">No users yet</p>
              <p className="text-navy-400 text-sm mt-1">Users will appear here after signing up</p>
            </div>
          ) : (
            <div className="space-y-3">
              {approvedUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isDevAdmin={user.email === 'agsdev@allianceglobalsolutions.com' || user.id === 'dev-admin'}
                  onRoleChange={(role) => onUpdateRole(user.user_id, role)}
                  isSaving={isSaving}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}