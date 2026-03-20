import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  const supabase = createClient()

  const fetchAgents = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('agent_profiles')
      .select('*')
      .order('name')

    if (error) {
      setError(error.message)
    } else {
      setAgents(data || [])
    }
    setIsLoading(false)
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

    const { error } = await supabase.from('agent_profiles').insert(
      newAgents.map(a => ({
        name: a.name,
        agent_id: a.id,
        email: a.email,
        phone: null,
        notes: null,
      }))
    )

    if (error) {
      setError(error.message)
    } else {
      fetchAgents()
      setShowCTMFetch(false)
    }
  }, [agents, ctmAgents, supabase, fetchAgents])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.agentId) {
      setError('Name and Agent ID are required')
      return
    }

    if (editingAgent) {
      const { error } = await supabase
        .from('agent_profiles')
        .update({
          name: formData.name,
          agent_id: formData.agentId,
          email: formData.email || null,
          phone: formData.phone || null,
          notes: formData.notes || null,
        })
        .eq('id', editingAgent.id)

      if (error) {
        setError(error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from('agent_profiles')
        .insert([
          {
            name: formData.name,
            agent_id: formData.agentId,
            email: formData.email || null,
            phone: formData.phone || null,
            notes: formData.notes || null,
          }
        ])

      if (error) {
        setError(error.message)
        return
      }
    }

    resetForm()
    fetchAgents()
  }, [formData, editingAgent, supabase, fetchAgents])

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
      await supabase
        .from('agent_profiles')
        .delete()
        .eq('id', id)
      fetchAgents()
    }
  }, [supabase, fetchAgents])

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