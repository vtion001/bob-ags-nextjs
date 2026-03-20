import React from 'react'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/select'
import Button from '@/components/ui/Button'
import { UserSettings } from '@/lib/settings/types'

interface SyncSettingsCardProps {
  settings: UserSettings
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>
  isSaving: boolean
  onSave: () => Promise<void>
}

export default function SyncSettingsCard({
  settings,
  setSettings,
  isSaving,
  onSave,
}: SyncSettingsCardProps) {
  return (
    <Card className="p-6 mb-6">
      <h2 className="text-lg font-bold text-navy-900 mb-6">Sync Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-navy-50">
          <div>
            <p className="text-navy-900 font-medium">Auto-sync Calls</p>
            <p className="text-sm text-navy-500">Automatically sync calls from CTM</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, auto_sync_calls: !prev.auto_sync_calls }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              settings.auto_sync_calls ? 'bg-navy-900' : 'bg-navy-200'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform flex items-center justify-center ${
                settings.auto_sync_calls ? 'translate-x-7.5' : 'translate-x-0.5'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${settings.auto_sync_calls ? 'bg-navy-900' : 'bg-navy-400'}`} />
            </span>
          </button>
        </div>

        {settings.auto_sync_calls && (
          <div className="p-4 rounded-lg bg-navy-50">
            <label className="block text-navy-900 font-medium mb-2">Sync Interval (minutes)</label>
            <Select
              value={String(settings.call_sync_interval)}
              onChange={(value) => setSettings(prev => ({ ...prev, call_sync_interval: parseInt(value) }))}
              options={[
                { value: '15', label: 'Every 15 minutes' },
                { value: '30', label: 'Every 30 minutes' },
                { value: '60', label: 'Every hour' },
                { value: '120', label: 'Every 2 hours' },
              ]}
              className="w-full"
            />
          </div>
        )}
      </div>

      <Button variant="primary" size="md" onClick={onSave} isLoading={isSaving} className="mt-6">
        Save Sync Settings
      </Button>
    </Card>
  )
}
