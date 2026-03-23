import React from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/select'
import { CTMAssignment, CTMAgent, CTMUserGroup } from '@/lib/settings/types'

interface CTMAssignmentsCardProps {
  ctmAssignments: CTMAssignment[]
  ctmAgents: CTMAgent[]
  ctmUserGroups: CTMUserGroup[]
  editingAssignment: string | null
  setEditingAssignment: (id: string | null) => void
  assignmentForm: { ctmAgentId: string; ctmUserGroupId: string }
  setAssignmentForm: React.Dispatch<React.SetStateAction<{ ctmAgentId: string; ctmUserGroupId: string }>>
  assignmentSaving: boolean
  onSave: (userId: string) => Promise<void>
  onCancel: () => void
  getAgentName: (id: string | null) => string
  getGroupName: (id: string | null) => string
}

function AssignmentStatusBadge({ 
  ctmAgentId, 
  ctmUserGroupId 
}: { 
  ctmAgentId: string | null
  ctmUserGroupId: string | null 
}) {
  if (ctmAgentId) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-navy-100 text-navy-800 text-xs font-medium">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Agent Assigned
      </span>
    )
  }
  if (ctmUserGroupId) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-navy-200 text-navy-800 text-xs font-medium">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Group Assigned
      </span>
    )
  }
  return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-navy-100 text-navy-700 text-xs font-medium">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      Needs Assignment
    </span>
  )
}

export default function CTMAssignmentsCard({
  ctmAssignments,
  ctmAgents,
  ctmUserGroups,
  editingAssignment,
  setEditingAssignment,
  assignmentForm,
  setAssignmentForm,
  assignmentSaving,
  onSave,
  onCancel,
  getAgentName,
  getGroupName,
}: CTMAssignmentsCardProps) {
  const filteredAssignments = ctmAssignments.filter(
    a => a.email !== 'agsdev@allianceglobalsolutions.com'
  )

  const needsAssignment = filteredAssignments.filter(
    a => !a.ctmAgentId && !a.ctmUserGroupId
  )
  const hasAgentAssignment = filteredAssignments.filter(a => a.ctmAgentId)
  const hasGroupAssignment = filteredAssignments.filter(a => a.ctmUserGroupId && !a.ctmAgentId)

  return (
    <Card className="p-6 mb-6 border-navy-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-navy-900">CTM Agent Assignments</h2>
          <p className="text-sm text-navy-500">Link users to CTM agents or groups so they only see their own calls in live monitoring</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-navy-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-navy-700">{needsAssignment.length}</div>
          <div className="text-xs text-navy-600 font-medium">Need Assignment</div>
          <div className="text-xs text-navy-500 mt-1">No calls visible</div>
        </div>
        <div className="bg-navy-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-navy-700">{hasAgentAssignment.length}</div>
          <div className="text-xs text-navy-600 font-medium">Agent Linked</div>
          <div className="text-xs text-navy-500 mt-1">See own calls</div>
        </div>
        <div className="bg-navy-50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-navy-700">{hasGroupAssignment.length}</div>
          <div className="text-xs text-navy-600 font-medium">Group Linked</div>
          <div className="text-xs text-navy-500 mt-1">See group calls</div>
        </div>
      </div>

      {ctmUserGroups.length === 0 && ctmAgents.length === 0 ? (
        <div className="p-6 bg-navy-50 rounded-lg text-center">
          <p className="text-navy-500 mb-2">No CTM agents or user groups found.</p>
          <p className="text-sm text-navy-400">Configure CTM credentials in the CTM Integrations section above.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-100">
                <th className="text-left py-3 px-4 font-semibold text-navy-700">User</th>
                <th className="text-left py-3 px-4 font-semibold text-navy-700">Role</th>
                <th className="text-left py-3 px-4 font-semibold text-navy-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-navy-700">CTM Agent</th>
                <th className="text-left py-3 px-4 font-semibold text-navy-700">CTM User Group</th>
                <th className="text-right py-3 px-4 font-semibold text-navy-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssignments.map(assignment => (
                <tr key={assignment.userId} className="border-b border-navy-50 hover:bg-navy-50/50">
                  <td className="py-3 px-4">
                    <p className="font-medium text-navy-900">{assignment.email}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      assignment.role === 'admin' ? 'bg-navy-900 text-white' :
                      assignment.role === 'manager' ? 'bg-navy-700 text-white' :
                      'bg-navy-200 text-navy-800'
                    }`}>
                      {assignment.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <AssignmentStatusBadge 
                      ctmAgentId={assignment.ctmAgentId} 
                      ctmUserGroupId={assignment.ctmUserGroupId} 
                    />
                  </td>
                  <td className="py-3 px-4">
                    {editingAssignment === assignment.userId ? (
                      <Select
                        value={assignmentForm.ctmAgentId}
                        onChange={(v) => setAssignmentForm(prev => ({ ...prev, ctmAgentId: v, ctmUserGroupId: '' }))}
                        options={[
                          { value: '', label: 'None' },
                          ...ctmAgents.map(a => ({ value: a.id, label: a.name })),
                        ]}
                        className="w-40"
                      />
                    ) : (
                      <span className={`font-medium ${assignment.ctmAgentId ? 'text-navy-900' : 'text-navy-300'}`}>
                        {getAgentName(assignment.ctmAgentId)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingAssignment === assignment.userId ? (
                      <Select
                        value={assignmentForm.ctmUserGroupId}
                        onChange={(v) => setAssignmentForm(prev => ({ ...prev, ctmUserGroupId: v, ctmAgentId: '' }))}
                        options={[
                          { value: '', label: 'None' },
                          ...ctmUserGroups.map(g => ({ value: g.id, label: g.name })),
                        ]}
                        className="w-40"
                      />
                    ) : (
                      <span className={`font-medium ${assignment.ctmUserGroupId ? 'text-navy-900' : 'text-navy-300'}`}>
                        {getGroupName(assignment.ctmUserGroupId)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingAssignment === assignment.userId ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={onCancel}
                          disabled={assignmentSaving}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onSave(assignment.userId)}
                          isLoading={assignmentSaving}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingAssignment(assignment.userId)
                          setAssignmentForm({
                            ctmAgentId: assignment.ctmAgentId || '',
                            ctmUserGroupId: assignment.ctmUserGroupId || '',
                          })
                        }}
                      >
                        Assign
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAssignments.length === 0 && (
            <p className="text-navy-400 text-center py-6">No other users to assign.</p>
          )}
        </div>
      )}

      <div className="mt-4 p-3 bg-navy-50 border border-navy-200 rounded-lg">
        <p className="text-sm text-navy-700">
          <strong>How it works:</strong> Assigning a CTM agent restricts a user to only see calls from that specific agent. Assigning a group gives them access to all calls from agents in that group. Users without assignment see no calls in live monitoring.
        </p>
      </div>
    </Card>
  )
}
