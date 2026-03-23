'use client'

import React from 'react'
import Link from 'next/link'

interface AgentAssignmentWarningProps {
  assignedAgentId?: string | null
  assignedGroupId?: string | null
  isAdmin?: boolean
}

export default function AgentAssignmentWarning({ 
  assignedAgentId, 
  assignedGroupId, 
  isAdmin 
}: AgentAssignmentWarningProps) {
  if (isAdmin || assignedAgentId || assignedGroupId) return null

  return (
    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-800">No CTM Agent Assigned</h3>
          <p className="text-sm text-amber-700 mt-1">
            Your account is not linked to a CTM agent. Contact an administrator to assign you a CTM agent so you can see your calls in live monitoring and the dashboard.
          </p>
          <Link 
            href="/dashboard/settings" 
            className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-800 hover:text-amber-900 hover:underline"
          >
            Go to Settings
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
