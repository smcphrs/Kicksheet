'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Shield, Users, Calendar, Settings } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()

  // 🚨 Hide navigation on auth pages, landing page, and public share links
  if (
    pathname === '/login' || 
    pathname === '/signup' || 
    pathname === '/' || 
    pathname?.startsWith('/share')
  ) {
    return null
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Teams', href: '/teams', icon: Shield },
    { name: 'Games', href: '/games', icon: Calendar },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <>
      {/* Desktop Top Nav */}
      <nav className="hidden sm:block fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/assets/kicksheet-logo.png" alt="Logo" className="h-8 dark:hidden" />
            <img src="/assets/kicksheet-logo-white.png" alt="Logo" className="h-8 hidden dark:block" />
          </Link>
          <div className="flex space-x-8">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 text-sm font-bold transition-colors ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-bold">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}