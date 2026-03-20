import React from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { UserSettings } from '@/lib/settings/types'

interface CTMIntegrationsCardProps {
  settings: UserSettings
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>
  isSaving: boolean
  onSave: () => Promise<void>
}

export default function CTMIntegrationsCard({
  settings,
  setSettings,
  isSaving,
  onSave,
}: CTMIntegrationsCardProps) {
  return (
    <Card className="p-6 mb-6">
      <h2 className="text-lg font-bold text-navy-900 mb-6">CTM Integrations</h2>
      
      <div className="space-y-4 mb-6">
        <Input
          label="CTM Access Key"
          type="password"
          value={settings.ctm_access_key}
          onChange={(e) => setSettings(prev => ({ ...prev, ctm_access_key: e.target.value }))}
          placeholder="Enter your access key"
          hint="Your CallTrackingMetrics API access key"
        />
        
        <Input
          label="CTM Secret Key"
          type="password"
          value={settings.ctm_secret_key}
          onChange={(e) => setSettings(prev => ({ ...prev, ctm_secret_key: e.target.value }))}
          placeholder="Enter your secret key"
          hint="Your CallTrackingMetrics API secret key"
        />

        <Input
          label="CTM Account ID"
          type="text"
          value={settings.ctm_account_id}
          onChange={(e) => setSettings(prev => ({ ...prev, ctm_account_id: e.target.value }))}
          placeholder="Enter your account ID"
          hint="Your CallTrackingMetrics account ID"
        />

        <Input
          label="Default Client"
          type="text"
          value={settings.default_client}
          onChange={(e) => setSettings(prev => ({ ...prev, default_client: e.target.value }))}
          placeholder="Enter default client"
          hint="Default client for API requests"
        />
      </div>

      <Button variant="primary" size="md" onClick={onSave} isLoading={isSaving}>
        Save CTM Settings
      </Button>
    </Card>
  )
}
