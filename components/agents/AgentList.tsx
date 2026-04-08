import React from 'react'
import { AgentProfile } from '@/hooks/dashboard/useAgentProfiles'

interface AgentListProps {
  agents: AgentProfile[]
  onEdit?: (agent: AgentProfile) => void
  onDelete?: (id: string) => void
}

export default function AgentList({ agents, onEdit, onDelete }: AgentListProps) {
  return (
    <div className="bg-white border border-navy-200 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-navy-50 border-b border-navy-200 text-sm font-semibold text-navy-600">
        <div className="col-span-1">Avatar</div>
        <div className="col-span-3">Name</div>
        <div className="col-span-4">Email</div>
        <div className="col-span-3">CTM Agent ID</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Rows */}
      {agents.map((agent, index) => (
        <div
          key={agent.id}
          className={`
            grid grid-cols-12 gap-4 px-6 py-4 items-center
            border-b border-navy-100 last:border-b-0
            hover:bg-navy-50/50 transition-colors
            ${index % 2 === 0 ? 'bg-white' : 'bg-navy-50/20'}
          `}
        >
          {/* Avatar */}
          <div className="col-span-1">
            <div className="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-navy-900">
                {agent.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Name */}
          <div className="col-span-3">
            <p className="font-medium text-navy-900 truncate">{agent.name}</p>
            {agent.phone && (
              <p className="text-xs text-navy-400 truncate">{agent.phone}</p>
            )}
          </div>

          {/* Email */}
          <div className="col-span-4">
            <p className="text-sm text-navy-600 truncate">{agent.email || '—'}</p>
          </div>

          {/* CTM Agent ID */}
          <div className="col-span-3">
            <code className="text-xs bg-navy-100 text-navy-700 px-2 py-1 rounded font-mono truncate block max-w-full">
              {agent.agent_id.length > 20 ? `${agent.agent_id.slice(0, 20)}...` : agent.agent_id}
            </code>
          </div>

          {/* Actions */}
          <div className="col-span-1 flex justify-end gap-1">
            {onEdit && (
              <button
                onClick={() => onEdit(agent)}
                className="p-2 text-navy-400 hover:text-navy-600 hover:bg-navy-100 rounded-lg transition-colors"
                title="Edit agent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(agent.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete agent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
