'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard', label: 'Calls', icon: 'phone' },
  { href: '/dashboard/monitor', label: 'Monitor', icon: 'pulse' },
  { href: '/dashboard/history', label: 'History', icon: 'history' },
  { href: '/dashboard/settings', label: 'Settings', icon: 'settings' },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session')
        if (!res.ok) {
          router.push('/')
          return
        }
        const data = await res.json()
        setEmail(data.email)
      } catch (error) {
        console.error('Session check failed:', error)
        router.push('/')
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-navy-200 border-t-navy-900 rounded-full animate-spin"></div>
          <p className="text-navy-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-900">
      <Navbar email={email || undefined} />

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-navy-900 border-r border-navy-800">
          <nav className="flex-1 px-4 py-8 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard')
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-navy-700 text-white'
                        : 'text-white hover:bg-navy-800'
                    }`}
                  >
                    {item.icon === 'phone' && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773c.021.061.040.123.057.187l1.068 5.339a1 1 0 01-.93 1.296h-1.924a1 1 0 01-.997-.92L4.3 6.513c-.026-.146-.053-.291-.082-.434A1 1 0 013.153 5H3a1 1 0 01-1-1V3z" />
                      </svg>
                    )}
                    {item.icon === 'pulse' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    )}
                    {item.icon === 'history' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {item.icon === 'settings' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      </svg>
                    )}
                    <span className="text-sm font-medium">{item.label}</span>
                  </span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
