'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Login failed')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoMode = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-navy-900">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <div className="inline-block p-4 bg-white/10 rounded-xl">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-navy-900 font-bold text-xl">B</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">BOB</h1>
          <p className="text-xl text-white/80 mb-6">Business Operations Butler</p>
          <p className="text-white/60 leading-relaxed">
            AI-powered business operations assistant. Automate workflows, analyze data, and streamline your business.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-navy-900 mb-2">Welcome Back</h2>
            <p className="text-navy-500">Enter your credentials to continue</p>
          </div>

          <Card hoverable={false} className="mb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              {error && <p className="text-sm text-red-500 -mt-2">{error}</p>}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Sign In
              </Button>
            </form>
          </Card>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-navy-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-navy-500">or</span>
            </div>
          </div>

          <Button
            onClick={handleDemoMode}
            variant="secondary"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            Try Demo Mode
          </Button>

          <p className="text-center text-navy-500 text-sm mt-6">
            Developer credentials: agsdev@allianceglobalsolutions.com / ags2026@@
          </p>
        </div>
      </div>
    </div>
  )
}