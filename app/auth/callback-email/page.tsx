'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type SignUpStatus = 'loading' | 'success' | 'pending' | 'denied' | 'error'

export default function EmailCallback() {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<SignUpStatus>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          console.error('Email callback error:', error)
          setStatus('error')
          setMessage('Email confirmation failed. Please try signing up again.')
          setTimeout(() => router.push('/auth/signup'), 5000)
          return
        }

        if (!user) {
          setStatus('pending')
          setMessage('Please check your email and click the confirmation link to complete your registration.')
          setTimeout(() => router.push('/auth/signup'), 10000)
          return
        }

        const response = await fetch('/api/auth/agent-lookup', {
          method: 'POST',
        })

        const result = await response.json()

        if (result.status === 'auto_assign') {
          setStatus('success')
          setMessage(`Welcome! Your account has been created and linked to your CTM agent. Redirecting to dashboard...`)
          setTimeout(() => router.push('/dashboard'), 3000)
          return
        }

        if (result.status === 'deny' || result.status === 'manual') {
          setStatus('pending')
          setMessage('Your account has been created! An administrator will review your access and assign your CTM agent permissions shortly.')
          setTimeout(() => router.push('/'), 8000)
          return
        }

        setStatus('pending')
        setMessage('Your account has been created! An administrator will review your access shortly.')
        setTimeout(() => router.push('/'), 8000)
      } catch (err) {
        console.error('Unexpected error in email callback:', err)
        setStatus('error')
        setMessage('An unexpected error occurred during registration. Please try signing up again.')
        setTimeout(() => router.push('/auth/signup'), 5000)
      }
    }

    handleCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
        {status === 'loading' && (
          <>
            <div className="w-12 h-12 border-4 border-navy-100 border-t-navy-900 rounded-full animate-spin" />
            <p className="text-navy-600 font-medium">Confirming your email...</p>
            <p className="text-navy-400 text-sm">Setting up your account</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-semibold text-lg">Account Created!</p>
            <p className="text-navy-600 text-sm">{message}</p>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-amber-600 font-semibold text-lg">Account Created - Pending Approval</p>
            <p className="text-navy-600 text-sm">{message}</p>
            <Link href="/" className="mt-4 text-navy-700 font-medium hover:underline text-sm">
              Return to sign in
            </Link>
          </>
        )}

        {status === 'denied' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 font-semibold text-lg">Access Pending</p>
            <p className="text-navy-600 text-sm">{message}</p>
            <Link href="/" className="mt-4 text-navy-700 font-medium hover:underline text-sm">
              Return to sign in
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-orange-600 font-semibold text-lg">Registration Issue</p>
            <p className="text-navy-600 text-sm">{message}</p>
            <Link href="/auth/signup" className="mt-4 text-navy-700 font-medium hover:underline text-sm">
              Try signing up again
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
