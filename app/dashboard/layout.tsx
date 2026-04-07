'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/dashboard/Navbar'
import Link from 'next/link'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

interface NavItem {
  href: string
  label: string
  icon: string
  description: string
  permission: string
}

const allNavItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Calls',
    icon: 'phone',
    description: 'View all calls',
    permission: 'can_view_calls',
  },
  {
    href: '/dashboard/monitor',
    label: 'Monitor',
    icon: 'pulse',
    description: 'Live monitoring',
    permission: 'can_view_monitor',
  },
  {
    href: '/dashboard/history',
    label: 'History',
    icon: 'history',
    description: 'Search calls',
    permission: 'can_view_history',
  },
  {
    href: '/dashboard/qa-logs',
    label: 'QA Logs',
    icon: 'clipboard',
    description: 'Override history',
    permission: 'qa_logs',
  },
  {
    href: '/dashboard/agents',
    label: 'Agents',
    icon: 'users',
    description: 'Manage profiles',
    permission: 'can_view_agents',
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: 'settings',
    description: 'Preferences',
    permission: 'settings',
  },
]

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { email, role, permissions, isLoading } = useAuth()

  React.useEffect(() => {
    if (!isLoading && role === 'agent' && pathname === '/dashboard') {
      window.location.href = '/dashboard/monitor'
    }
    if (!isLoading && role === 'viewer' && pathname === '/dashboard') {
      window.location.href = '/dashboard/monitor'
    }
    if (!isLoading && role === 'qa' && pathname === '/dashboard') {
      // QA can view calls, stay on /dashboard
    }
  }, [isLoading, role, pathname])

  const getFilteredNavItems = (): NavItem[] => {
    return allNavItems.filter(item => {
      if (item.permission === 'settings') return permissions.can_manage_settings || role === 'admin'
      if (item.permission === 'can_view_calls') return permissions.can_view_calls
      if (item.permission === 'can_view_monitor') return permissions.can_view_monitor
      if (item.permission === 'can_view_history') return permissions.can_view_history
      if (item.permission === 'can_view_agents') return permissions.can_view_agents
      if (item.permission === 'qa_logs') return role === 'admin' || role === 'qa'
      return true
    })
  }

  const renderIcon = (icon: string, isActive: boolean) => {
    const activeClass = isActive
      ? 'bg-navy-900 text-white'
      : 'bg-white/10 text-white/80 group-hover:bg-white/20 group-hover:text-white'

    return (
      <span
        className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${activeClass}`}
      >
        {icon === 'phone' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        )}
        {icon === 'pulse' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        )}
        {icon === 'history' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
        {icon === 'settings' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        )}
        {icon === 'users' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )}
        {icon === 'clipboard' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        )}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-navy-100 border-t-navy-900 rounded-full animate-spin" />
          <p className="text-navy-500 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  const filteredNavItems = getFilteredNavItems()

  return (
    <div className="min-h-screen bg-white">
      <div className="no-print">
        <Navbar email={email || undefined} />
      </div>

      <div className="flex">
        <aside className="hidden md:flex flex-col w-64 bg-navy-900 text-white no-print">
          <nav className="flex-1 px-3 py-6 space-y-1">
            {filteredNavItems.map(item => {
              const isActive =
                pathname === item.href ||
                (item.href === '/dashboard' && pathname === '/dashboard')
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white text-navy-900'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {renderIcon(item.icon, isActive)}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium block truncate">{item.label}</span>
                      <span
                        className={`text-xs block truncate ${
                          isActive ? 'text-navy-500' : 'text-white/50'
                        }`}
                      >
                        {item.description}
                      </span>
                    </div>
                  </span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 m-3 rounded-xl bg-white/10 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-navy-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">BOB Agent</span>
                <span className="text-xs text-white/60">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-white min-h-screen">{children}</main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </AuthProvider>
  )
}

