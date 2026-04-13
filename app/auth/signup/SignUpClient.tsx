'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

export default function SignUpClient() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        setIsLoading(false)
        return
      }

      setMessage('Account created successfully! An administrator will review your access and assign your CTM agent permissions shortly. You can now sign in.')
      setTimeout(() => router.push('/'), 3000)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 bg-navy-50">
        <div className="max-w-md text-center">
          <div className="mb-8">
            <Image src="/images/bob-logo.webp" alt="BOB Logo" width={440} height={440} priority className="w-auto h-auto mx-auto" style={{ maxWidth: '440px', maxHeight: '220px' }} sizes="(max-width: 768px) 100vw, 440px" />
          </div>
          <h1 className="text-2xl font-bold text-navy-900 mb-4">Join BOB</h1>
          <p className="text-navy-600 leading-relaxed">Create your account to get started. After registration, your account will be reviewed by an administrator to assign your CTM agent permissions.</p>
          <div className="mt-8 space-y-4 text-left">
            <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div><div><p className="font-medium text-navy-800">Sign up with your email</p><p className="text-sm text-navy-500">Create an account using your company email</p></div></div>
            <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div><div><p className="font-medium text-navy-800">Admin reviews your access</p><p className="text-sm text-navy-500">An admin links your account to a CTM agent</p></div></div>
            <div className="flex items-start gap-3"><div className="w-6 h-6 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div><div><p className="font-medium text-navy-800">Access granted</p><p className="text-sm text-navy-500">Start monitoring your calls</p></div></div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8"><h2 className="text-3xl font-bold text-navy-900 mb-2">Create Account</h2><p className="text-navy-500">Already have an account? <Link href="/" className="text-navy-700 font-medium hover:underline">Sign in</Link></p></div>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
          {message && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{message}</div>}
          <Card hoverable={false} className="mb-6 !border-0 shadow-none">
            <form onSubmit={handleSignUp} className="space-y-4">
              <Input label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required disabled={isLoading} />
              <Input label="Work Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required disabled={isLoading} autoComplete="username" />
              <div className="relative">
                <Input label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} disabled={isLoading} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-navy-400 hover:text-navy-600">{showPassword ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}</button>
              </div>
              <Input label="Confirm Password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" required minLength={8} disabled={isLoading} autoComplete="new-password" />
              <Button type="submit" variant="primary" size="lg" className="w-full mt-6" isLoading={isLoading} disabled={isLoading}>Create Account</Button>
            </form>
          </Card>
          <p className="text-center text-xs text-navy-400 mt-8">By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  )
}
