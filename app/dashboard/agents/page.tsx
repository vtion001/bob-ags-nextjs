'use client'

import React from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { useAgentProfiles } from '@/hooks/dashboard/useAgentProfiles'
import { AgentForm, AgentCard, CTMImportModal } from '@/components/agents'

export default function AgentsPage() {
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

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Agent Profiles</h1>
        <p className="text-navy-500">Manage agent profiles for filtering call history</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

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

      {agents.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">No agent profiles yet</h3>
          <p className="text-navy-500 mb-4">Create agent profiles to easily filter calls by agent.</p>
          <Button variant="primary" size="md" onClick={() => setShowForm(true)}>
            Add First Agent
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}