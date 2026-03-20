'use client'

import React, { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/client'

interface UserSettings {
  ctm_access_key: string
  ctm_secret_key: string
  ctm_account_id: string
  openrouter_api_key: string
  default_client: string
  light_mode: boolean
  email_notifications: boolean
  auto_sync_calls: boolean
  call_sync_interval: number
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    ctm_access_key: '',
    ctm_secret_key: '',
    ctm_account_id: '',
    openrouter_api_key: '',
    default_client: 'flyland',
    light_mode: true,
    email_notifications: false,
    auto_sync_calls: true,
    call_sync_interval: 60,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }))
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      
      if (!res.ok) throw new Error('Failed to save settings')
      
      setSaveMessage('Settings saved successfully')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearCredentials = async () => {
    if (!confirm('Are you sure you want to clear all credentials? This cannot be undone.')) {
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!res.ok) throw new Error('Failed to clear settings')
      
      setSettings({
        ctm_access_key: '',
        ctm_secret_key: '',
        ctm_account_id: '',
        openrouter_api_key: '',
        default_client: 'flyland',
        light_mode: true,
        email_notifications: false,
        auto_sync_calls: true,
        call_sync_interval: 60,
      })
      setSaveMessage('Credentials cleared')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

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

        <Button variant="primary" size="md" onClick={handleSave} isLoading={isSaving}>
          Save CTM Settings
        </Button>
      </Card>

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

        <Button variant="primary" size="md" onClick={handleSave} isLoading={isSaving}>
          Save AI Settings
        </Button>
      </Card>

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
              <select
                value={settings.call_sync_interval}
                onChange={(e) => setSettings(prev => ({ ...prev, call_sync_interval: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 bg-white text-navy-900"
              >
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every hour</option>
                <option value={120}>Every 2 hours</option>
              </select>
            </div>
          )}
        </div>

        <Button variant="primary" size="md" onClick={handleSave} isLoading={isSaving} className="mt-6">
          Save Sync Settings
        </Button>
      </Card>

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

        <Button variant="primary" size="md" onClick={handleSave} isLoading={isSaving} className="mt-6">
          Save Preferences
        </Button>
      </Card>

      <Card className="p-6 border-red-200">
        <h2 className="text-lg font-bold text-red-600 mb-4">Danger Zone</h2>
        <p className="text-navy-600 mb-4">
          Clear all stored credentials. This action cannot be undone.
        </p>
        <Button
          variant="secondary"
          size="md"
          onClick={handleClearCredentials}
          className="text-red-600 border-red-300 hover:bg-red-50"
        >
          Clear All Credentials
        </Button>
      </Card>

      {saveMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-navy-900 text-white px-4 py-3 rounded-lg shadow-lg">
          {saveMessage}
        </div>
      )}
    </div>
  )
}