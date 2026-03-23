import React from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface DangerZoneCardProps {
  onClearCredentials: () => Promise<void>
}

export default function DangerZoneCard({ onClearCredentials }: DangerZoneCardProps) {
  return (
    <Card className="p-6 border-navy-300">
      <h2 className="text-lg font-bold text-navy-900 mb-4">Danger Zone</h2>
      <p className="text-navy-600 mb-4">
        Clear all stored credentials. This action cannot be undone.
      </p>
      <Button
        variant="secondary"
        size="md"
        onClick={onClearCredentials}
        className="text-navy-700 border-navy-300 hover:bg-navy-50"
      >
        Clear All Credentials
      </Button>
    </Card>
  )
}
