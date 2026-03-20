import React from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { AgentProfile } from '@/hooks/dashboard/useAgentProfiles'

interface AgentFormData {
  name: string
  agentId: string
  email: string
  phone: string
  notes: string
}

interface AgentFormProps {
  formData: AgentFormData
  onFormDataChange: (d: AgentFormData) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  editingAgent: AgentProfile | null
  error: string | null
}

export default function AgentForm({
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  editingAgent,
  error,
}: AgentFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Name *"
          type="text"
          value={formData.name}
          onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
          placeholder="John Smith"
        />
        <Input
          label="Agent ID *"
          type="text"
          value={formData.agentId}
          onChange={(e) => onFormDataChange({ ...formData, agentId: e.target.value })}
          placeholder="agent_123456"
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => onFormDataChange({ ...formData, email: e.target.value })}
          placeholder="john@company.com"
        />
        <Input
          label="Phone"
          type="text"
          value={formData.phone}
          onChange={(e) => onFormDataChange({ ...formData, phone: e.target.value })}
          placeholder="+1 234 567 8900"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-navy-700 mb-2">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => onFormDataChange({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about this agent..."
          className="w-full px-4 py-2.5 bg-white border border-navy-200 rounded-lg text-navy-900 placeholder-navy-400 transition-all duration-200 focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20 focus:outline-none"
          rows={3}
        />
      </div>
      <div className="flex gap-3">
        <Button type="submit" variant="primary" size="md">
          {editingAgent ? 'Update Agent' : 'Add Agent'}
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}