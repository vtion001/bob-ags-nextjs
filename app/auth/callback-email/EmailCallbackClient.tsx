'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EmailCallbackClient() {
  const router = useRouter()

  useEffect(() => {
    setTimeout(() => router.push('/'), 3000)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4 max-w-md text-center px-6">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-green-600 font-semibold text-lg">Email Confirmed!</p>
        <p className="text-navy-600 text-sm">Your account is ready. Redirecting to sign in...</p>
        <Link href="/" className="mt-4 text-navy-700 font-medium hover:underline text-sm">
          Sign in now
        </Link>
      </div>
    </div>
  )
}
