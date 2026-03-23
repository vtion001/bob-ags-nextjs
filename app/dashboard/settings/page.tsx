'use client'

import React from 'react'
import { useSettings } from '@/hooks/settings/useSettings'
import {
  AIAnalysisCard,
  SyncSettingsCard,
  PreferencesCard,
  UserPermissionsCard,
  CTMAssignmentsCard,
  DangerZoneCard,
} from '@/components/settings'

export default function SettingsPage() {
  const {
    settings,
    setSettings,
    isLoading,
    isSaving,
    saveMessage,
    error,
    isAdmin,
    showAddUser,
    setShowAddUser,
    newUserEmail,
    setNewUserEmail,
    newUserRole,
    setNewUserRole,
    users,
    ctmAssignments,
    ctmAgents,
    ctmUserGroups,
    editingAssignment,
    setEditingAssignment,
    assignmentForm,
    setAssignmentForm,
    assignmentSaving,
    handleSave,
    handleClearCredentials,
    handleAddUser,
    handleUpdateRole,
    handleApproveUser,
    handleRejectUser,
    handleSaveCTMAssignment,
    cancelEditAssignment,
    getAgentName,
    getGroupName,
  } = useSettings()

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-navy-100 border-t-navy-900 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Settings</h1>
        <p className="text-navy-500">Manage your integrations and preferences</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-navy-100 border border-navy-300 rounded-lg text-navy-700">
          {error}
        </div>
      )}

      <AIAnalysisCard
        settings={settings}
        setSettings={setSettings}
        isSaving={isSaving}
        onSave={handleSave}
      />

      <SyncSettingsCard
        settings={settings}
        setSettings={setSettings}
        isSaving={isSaving}
        onSave={handleSave}
      />

      <PreferencesCard
        settings={settings}
        setSettings={setSettings}
        isSaving={isSaving}
        onSave={handleSave}
      />

      {isAdmin && (
        <UserPermissionsCard
          users={users}
          showAddUser={showAddUser}
          setShowAddUser={setShowAddUser}
          newUserEmail={newUserEmail}
          setNewUserEmail={setNewUserEmail}
          newUserRole={newUserRole}
          setNewUserRole={setNewUserRole}
          isSaving={isSaving}
          onAddUser={handleAddUser}
          onUpdateRole={handleUpdateRole}
          onApproveUser={handleApproveUser}
          onRejectUser={handleRejectUser}
        />
      )}

      {isAdmin && (
        <CTMAssignmentsCard
          ctmAssignments={ctmAssignments}
          ctmAgents={ctmAgents}
          ctmUserGroups={ctmUserGroups}
          editingAssignment={editingAssignment}
          setEditingAssignment={setEditingAssignment}
          assignmentForm={assignmentForm}
          setAssignmentForm={setAssignmentForm}
          assignmentSaving={assignmentSaving}
          onSave={handleSaveCTMAssignment}
          onCancel={cancelEditAssignment}
          getAgentName={getAgentName}
          getGroupName={getGroupName}
        />
      )}

      <DangerZoneCard onClearCredentials={handleClearCredentials} />

      {saveMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-900 text-white px-4 py-3 rounded-lg shadow-lg">
          {saveMessage}
        </div>
      )}
    </div>
  )
}
