import React from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { AgentProfile } from '@/hooks/dashboard/useAgentProfiles'

interface AgentCardProps {
  agent: AgentProfile
  onEdit: (agent: AgentProfile) => void
  onDelete: (id: string) => void
}

export default function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center">
          <span className="text-xl font-bold text-navy-900">
            {agent.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(agent)}
            className="p-2 text-navy-400 hover:text-navy-600 hover:bg-navy-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(agent.id)}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-navy-900 mb-1">{agent.name}</h3>
      <p className="text-sm text-navy-500 mb-2">ID: {agent.agent_id}</p>
      {agent.email && (
        <p className="text-sm text-navy-400 mb-1">{agent.email}</p>
      )}
      {agent.phone && (
        <p className="text-sm text-navy-400 mb-1">{agent.phone}</p>
      )}
      {agent.notes && (
        <p className="text-sm text-navy-400 mt-3 line-clamp-2">{agent.notes}</p>
      )}
    </Card>
  )
}