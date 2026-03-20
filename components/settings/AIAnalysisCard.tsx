import React from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { UserSettings } from '@/lib/settings/types'

interface AIAnalysisCardProps {
  settings: UserSettings
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>
  isSaving: boolean
  onSave: () => Promise<void>
}

export default function AIAnalysisCard({
  settings,
  setSettings,
  isSaving,
  onSave,
}: AIAnalysisCardProps) {
  return (
    <Card className="p-6 mb-6">
      <h2 className="text-lg font-bold text-navy-900 mb-6">AI Analysis</h2>
      
      <div className="space-y-4 mb-6">
        <Input
          label="OpenRouter API Key"
          type="password"
          value={settings.openrouter_api_key}
          onChange={(e) => setSettings(prev => ({ ...prev, openrouter_api_key: e.target.value }))}
          placeholder="Enter your OpenRouter API key"
          hint="API key for AI-powered analysis"
        />
      </div>

      <Button variant="primary" size="md" onClick={onSave} isLoading={isSaving}>
        Save AI Settings
      </Button>
    </Card>
  )
}
