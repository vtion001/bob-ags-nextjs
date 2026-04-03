import { useState, useEffect, useCallback } from 'react'

interface CTMAgent {
  id: string
  name: string
  email: string
}

export interface AgentProfile {
  id: string
  name: string
  agent_id: string
  email: string | null
  phone: string | null
  notes: string | null
  created_at: string
}

interface UseAgentProfilesReturn {
  agents: AgentProfile[]
  ctmAgents: CTMAgent[]
  isLoading: boolean
  isFetchingCTM: boolean
  error: string | null
  showForm: boolean
  setShowForm: (v: boolean) => void
  showCTMFetch: boolean
  setShowCTMFetch: (v: boolean) => void
  editingAgent: AgentProfile | null
  setEditingAgent: (a: AgentProfile | null) => void
  formData: {
    name: string
    agentId: string
    email: string
    phone: string
    notes: string
  }
  setFormData: (d: typeof initialFormData) => void
  fetchAgents: () => Promise<void>
  fetchCTMAgents: () => Promise<void>
  handleSubmit: (e: React.FormEvent) => Promise<void>
  handleEdit: (agent: AgentProfile) => void
  handleDelete: (id: string) => Promise<void>
  handleAddCTMAgent: (ctmAgent: CTMAgent) => void
  handleAddAllCTMAgents: () => Promise<void>
  resetForm: () => void
}

const initialFormData = {
  name: '',
  agentId: '',
  email: '',
  phone: '',
  notes: '',
}

export function useAgentProfiles(): UseAgentProfilesReturn {
  const [agents, setAgents] = useState<AgentProfile[]>([])
  const [ctmAgents, setCtmAgents] = useState<CTMAgent[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showCTMFetch, setShowCTMFetch] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AgentProfile | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingCTM, setIsFetchingCTM] = useState(false)

  const fetchAgents = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/agents/profiles')
      if (!response.ok) throw new Error('Failed to fetch agent profiles')
      const data = await response.json()
      setAgents(data.agents || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  const fetchCTMAgents = useCallback(async () => {
    setIsFetchingCTM(true)
    setError(null)
    try {
      const response = await fetch('/api/ctm/agents')
      if (!response.ok) throw new Error('Failed to fetch CTM agents')
      const data = await response.json()
      setCtmAgents(data.agents || [])
      setShowCTMFetch(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsFetchingCTM(false)
    }
  }, [])

  const handleAddCTMAgent = useCallback((ctmAgent: CTMAgent) => {
    setFormData({
      name: ctmAgent.name,
      agentId: ctmAgent.id,
      email: ctmAgent.email,
      phone: '',
      notes: '',
    })
    setEditingAgent(null)
    setShowForm(true)
    setShowCTMFetch(false)
  }, [])

  const handleAddAllCTMAgents = useCallback(async () => {
    const existingAgentIds = agents.map(a => a.agent_id)
    const newAgents = ctmAgents.filter(a => !existingAgentIds.includes(a.id))

    if (newAgents.length === 0) {
      setError('All CTM agents already exist in your profiles')
      return
    }

    try {
      for (const agent of newAgents) {
        const response = await fetch('/api/agents/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: agent.name,
            agent_id: agent.id,
            email: agent.email,
            phone: null,
            notes: null,
          }),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to add agent')
        }
      }
      fetchAgents()
      setShowCTMFetch(false)
    } catch (err: any) {
      setError(err.message)
    }
  }, [agents, ctmAgents, fetchAgents])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.agentId) {
      setError('Name and Agent ID are required')
      return
    }

    try {
      if (editingAgent) {
        const response = await fetch('/api/agents/profiles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingAgent.id,
            name: formData.name,
            agent_id: formData.agentId,
            email: formData.email || null,
            phone: formData.phone || null,
            notes: formData.notes || null,
          }),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update agent')
        }
      } else {
        const response = await fetch('/api/agents/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            agent_id: formData.agentId,
            email: formData.email || null,
            phone: formData.phone || null,
            notes: formData.notes || null,
          }),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create agent')
        }
      }

      resetForm()
      fetchAgents()
    } catch (err: any) {
      setError(err.message)
    }
  }, [formData, editingAgent, fetchAgents])

  const resetForm = useCallback(() => {
    setFormData(initialFormData)
    setEditingAgent(null)
    setShowForm(false)
    setError(null)
  }, [])

  const handleEdit = useCallback((agent: AgentProfile) => {
    setEditingAgent(agent)
    setFormData({
      name: agent.name,
      agentId: agent.agent_id,
      email: agent.email || '',
      phone: agent.phone || '',
      notes: agent.notes || '',
    })
    setShowForm(true)
  }, [])

  const handleDelete = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this agent profile?')) {
      try {
        const response = await fetch(`/api/agents/profiles?id=${id}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to delete agent')
        }
        fetchAgents()
      } catch (err: any) {
        setError(err.message)
      }
    }
  }, [fetchAgents])

  return {
    agents,
    ctmAgents,
    isLoading,
    isFetchingCTM,
    error,
    showForm,
    setShowForm,
    showCTMFetch,
    setShowCTMFetch,
    editingAgent,
    setEditingAgent,
    formData,
    setFormData,
    fetchAgents,
    fetchCTMAgents,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleAddCTMAgent,
    handleAddAllCTMAgents,
    resetForm,
  }
}