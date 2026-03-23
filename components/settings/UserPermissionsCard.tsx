import React from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/select'
import { UserRole, RoleType } from '@/lib/settings/types'

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
          <h2 className="text-lg font-bold text-navy-900">User Permissions</h2>
          <p className="text-sm text-navy-500">Manage user roles and navigation access</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddUser(!showAddUser)}
        >
          {showAddUser ? 'Cancel' : 'Add User'}
        </Button>
      </div>

      {showAddUser && (
        <div className="mb-6 p-4 bg-navy-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Email"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="user@example.com"
            />
            <Select
              label="Role"
              value={newUserRole}
              onChange={(value) => setNewUserRole(value as RoleType)}
              options={[
                { value: 'viewer', label: 'Viewer - Monitor only' },
                { value: 'manager', label: 'Manager - Full access (no settings)' },
                { value: 'admin', label: 'Admin - Full access' },
              ]}
              className="w-full"
            />
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

      <div className="space-y-4">
        {pendingUsers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-navy-700 uppercase tracking-wide mb-3">
              Pending Approval ({pendingUsers.length})
            </h3>
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-navy-50 border border-navy-200">
                  <div className="flex-1">
                    <p className="font-medium text-navy-900">{user.email}</p>
                    <p className="text-sm text-navy-600">Waiting for approval</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onApproveUser(user.user_id, 'viewer')}
                      disabled={isSaving}
                    >
                      Approve Viewer
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onApproveUser(user.user_id, 'manager')}
                      disabled={isSaving}
                    >
                      Approve Manager
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onRejectUser(user.user_id)}
                      disabled={isSaving}
                      className="text-navy-600 border-navy-300 hover:bg-navy-100"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <h3 className="text-sm font-semibold text-navy-600 uppercase tracking-wide mb-3">
          Approved Users ({approvedUsers.length})
        </h3>
        
        {approvedUsers.length === 0 && !pendingUsers.length ? (
          <p className="text-navy-500 text-center py-4">No users yet. Users will appear here after signing up.</p>
        ) : (
          <div className="space-y-3">
            {approvedUsers.map((user) => {
              const isDevAdmin = user.email === 'agsdev@allianceglobalsolutions.com' || user.id === 'dev-admin'
              return (
                <div key={user.id} className={`flex items-center justify-between p-4 rounded-lg ${isDevAdmin ? 'bg-navy-100 border border-navy-200' : 'bg-navy-50'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-navy-900">{user.email}</p>
                      {isDevAdmin && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-navy-900 text-white rounded-full">
                          Admin
                        </span>
                      )}
                      {user.approved && !isDevAdmin && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-navy-200 text-navy-800 rounded-full">
                          Approved
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-navy-500">
                      {user.role === 'admin' && 'Full access to all features'}
                      {user.role === 'manager' && 'Access to calls, monitor, history, and analysis'}
                      {user.role === 'viewer' && 'Monitor tab only'}
                    </p>
                  </div>
                  {isDevAdmin ? (
                    <span className="px-3 py-2 text-sm font-medium text-navy-700 bg-navy-200 rounded-lg">
                      Full Access
                    </span>
                  ) : (
                    <Select
                      value={user.role}
                      onChange={(value) => onUpdateRole(user.user_id, value as RoleType)}
                      options={[
                        { value: 'viewer', label: 'Viewer' },
                        { value: 'manager', label: 'Manager' },
                        { value: 'admin', label: 'Admin' },
                      ]}
                      disabled={isSaving}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
