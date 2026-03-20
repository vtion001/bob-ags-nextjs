import React from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { UserSettings } from '@/lib/settings/types'

interface PreferencesCardProps {
  settings: UserSettings
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>
  isSaving: boolean
  onSave: () => Promise<void>
}

export default function PreferencesCard({
  settings,
  setSettings,
  isSaving,
  onSave,
}: PreferencesCardProps) {
  return (
    <Card className="p-6 mb-6">
      <h2 className="text-lg font-bold text-navy-900 mb-6">Preferences</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 rounded-lg bg-navy-50">
          <div>
            <p className="text-navy-900 font-medium">Light Mode</p>
            <p className="text-sm text-navy-500">Clean white interface</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, light_mode: !prev.light_mode }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              settings.light_mode ? 'bg-navy-900' : 'bg-navy-200'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform flex items-center justify-center ${
                settings.light_mode ? 'translate-x-7.5' : 'translate-x-0.5'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${settings.light_mode ? 'bg-navy-900' : 'bg-navy-400'}`} />
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-navy-50">
          <div>
            <p className="text-navy-900 font-medium">Email Notifications</p>
            <p className="text-sm text-navy-500">Receive notifications for hot leads</p>
          </div>
          <button
            onClick={() => setSettings(prev => ({ ...prev, email_notifications: !prev.email_notifications }))}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              settings.email_notifications ? 'bg-navy-900' : 'bg-navy-200'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform flex items-center justify-center ${
                settings.email_notifications ? 'translate-x-7.5' : 'translate-x-0.5'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${settings.email_notifications ? 'bg-navy-900' : 'bg-navy-400'}`} />
            </span>
          </button>
        </div>
      </div>

      <Button variant="primary" size="md" onClick={onSave} isLoading={isSaving} className="mt-6">
        Save Preferences
      </Button>
    </Card>
  )
}
