'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export interface NavbarProps {
  email?: string
  onLogout?: () => void
}

export default function Navbar({ email, onLogout }: NavbarProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      // Use router.push instead of window.location.href to allow React components
      // to properly unmount before navigation, stopping intervals and cleanup effects
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
      // Still navigate to login on error
      router.push('/')
    }
  }

  const handleSettingsClick = () => {
    router.push('/dashboard/settings')
  }

  return (
    <nav className="bg-white border-b border-navy-200 sticky top-0 z-50 shadow-sm">
      <div className="h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <Image
              src="/images/bob-logo-nav.webp"
              alt="BOB"
              width={40}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </div>

        <div className="flex items-center gap-4">
          {email && (
            <span className="text-sm text-navy-600 hidden sm:block">{email}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSettingsClick}
            className="text-navy-600 hover:text-navy-900 hover:bg-navy-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoading}
            className="text-navy-600 hover:text-red-600 hover:bg-red-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </Button>
        </div>
      </div>
    </nav>
  )
}
