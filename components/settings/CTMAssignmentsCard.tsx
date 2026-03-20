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

  return (
    <Card className="p-6 mb-6 border-navy-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-navy-900">CTM Agent Assignments</h2>
          <p className="text-sm text-navy-500">Assign CTM agents or user groups to non-admin users so they only see their own calls</p>
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
                      assignment.role === 'admin' ? 'bg-amber-100 text-amber-700' :
                      assignment.role === 'manager' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {assignment.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {editingAssignment === assignment.userId ? (
                      <Select
                        value={assignmentForm.ctmAgentId}
                        onChange={(v) => setAssignmentForm(prev => ({ ...prev, ctmAgentId: v }))}
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
                        onChange={(v) => setAssignmentForm(prev => ({ ...prev, ctmUserGroupId: v }))}
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

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-700">
          <strong>How it works:</strong> Assigning a CTM agent or user group to a non-admin user restricts their dashboard to only see calls from that agent or group. Assigning neither means they have no CTM filtering applied.
        </p>
      </div>
    </Card>
  )
}
