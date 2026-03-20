import React from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { AgentProfile } from '@/hooks/dashboard/useAgentProfiles'

interface CTMAgent {
  id: string
  name: string
  email: string
}

interface CTMImportModalProps {
  ctmAgents: CTMAgent[]
  agents: AgentProfile[]
  onAddAgent: (ctmAgent: CTMAgent) => void
  onAddAll: () => void
  onClose: () => void
}

export default function CTMImportModal({
  ctmAgents,
  agents,
  onAddAgent,
  onAddAll,
  onClose,
}: CTMImportModalProps) {
  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-navy-900">
          CTM Agents ({ctmAgents.length})
        </h3>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={onAddAll}>
            Add All
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {ctmAgents.map((agent) => {
          const exists = agents.some(a => a.agent_id === agent.id)
          return (
            <div
              key={agent.id}
              className="flex items-center justify-between p-3 bg-navy-50 rounded-lg"
            >
              <div>
                <p className="font-medium text-navy-900">{agent.name}</p>
                <p className="text-sm text-navy-500">{agent.email}</p>
              </div>
              {exists ? (
                <span className="text-sm text-green-600 font-medium">Already added</span>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => onAddAgent(agent)}>
                  Add
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}