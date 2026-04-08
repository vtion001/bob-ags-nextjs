'use client'

import React from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useAgentProfiles } from '@/hooks/dashboard/useAgentProfiles'
import { useAuth } from '@/contexts/AuthContext'
import { AgentForm, AgentList, CTMImportModal } from '@/components/agents'

export default function AgentsPage() {
  const { role, ctmAgentId, isAdmin } = useAuth()
  const {
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
    formData,
    setFormData,
    fetchCTMAgents,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleAddCTMAgent,
    handleAddAllCTMAgents,
    resetForm,
  } = useAgentProfiles()

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-navy-100 border-t-navy-900 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const filteredAgents = isAdmin ? agents : agents.filter(a => a.agent_id === ctmAgentId)
  const showAllControls = isAdmin || role === 'manager'

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Agent Profiles</h1>
        <p className="text-navy-500">
          {isAdmin ? 'Manage agent profiles for filtering call history' : 'Your assigned agent profile'}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {showAllControls && (
        <div className="mb-6 flex gap-3 justify-end">
          <Button
            variant="secondary"
            size="md"
            onClick={fetchCTMAgents}
            isLoading={isFetchingCTM}
            disabled={isFetchingCTM || isLoading}
          >
            Fetch from CTM
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Add Agent'}
          </Button>
        </div>
      )}

      {showForm && (
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-bold text-navy-900 mb-4">
            {editingAgent ? 'Edit Agent Profile' : 'Add New Agent Profile'}
          </h3>
          <AgentForm
            formData={formData}
            onFormDataChange={setFormData}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            editingAgent={editingAgent}
            error={error}
          />
        </Card>
      )}

      {showCTMFetch && ctmAgents.length > 0 && (
        <CTMImportModal
          ctmAgents={ctmAgents}
          agents={agents}
          onAddAgent={handleAddCTMAgent}
          onAddAll={handleAddAllCTMAgents}
          onClose={() => setShowCTMFetch(false)}
        />
      )}

      {filteredAgents.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">
            {isAdmin ? 'No agent profiles yet' : 'No agent profile assigned'}
          </h3>
          <p className="text-navy-500 mb-4">
            {isAdmin 
              ? 'Create agent profiles to easily filter calls by agent.'
              : 'Contact an administrator to assign a CTM agent to your account.'
            }
          </p>
          {isAdmin && (
            <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
              Add First Agent
            </Button>
          )}
        </Card>
      ) : (
        <AgentList
          agents={filteredAgents}
          onEdit={showAllControls ? handleEdit : undefined}
          onDelete={showAllControls ? handleDelete : undefined}
        />
      )}
    </div>
  )
}