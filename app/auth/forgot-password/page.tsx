'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setMessage('Password reset email sent. Check your inbox.')
      setEmail('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-navy-50">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <Image
              src="/images/bob-logo.webp"
              alt="BOB Logo"
              width={440}
              height={440}
              priority
              className="w-auto h-auto mx-auto"
              style={{ maxWidth: '440px', maxHeight: '220px' }}
              sizes="(max-width: 768px) 100vw, 440px"
            />
          </div>
          <h1 className="text-2xl font-bold text-navy-900 mb-4">Reset Your Password</h1>
          <p className="text-navy-600 leading-relaxed">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>
      </div>

      {/* Right side - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-navy-900 mb-2">Forgot Password</h2>
            <p className="text-navy-500">
              Remember your password?{' '}
              <Link href="/" className="text-navy-700 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {message}
            </div>
          )}

          <Card hoverable={false} className="mb-6 !border-0 shadow-none">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                disabled={isLoading}
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-6"
                isLoading={isLoading}
                disabled={isLoading || !email}
              >
                Send Reset Link
              </Button>
            </form>
          </Card>

          <p className="text-center text-sm text-navy-500 mt-6">
            Remember your password?{' '}
            <Link href="/" className="text-navy-700 font-medium hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}