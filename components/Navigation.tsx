'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Shield, Calendar, Settings, ShieldAlert } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Navigation() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdminStatus() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        
        if (data?.is_admin) {
          setIsAdmin(true)
        }
      }
    }
    checkAdminStatus()
  }, [])

  // 🚨 Hide navigation on auth pages, landing page, and public share/join links
  if (
    pathname === '/login' || 
    pathname === '/signup' || 
    pathname === '/' || 
    pathname?.startsWith('/share') ||
    pathname?.startsWith('/join')
  ) {
    return null
  }

  // Base nav items (Admin removed from here)
  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Teams', href: '/teams', icon: Shield },
    { name: 'Games', href: '/games', icon: Calendar },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <>
      {/* Top Fixed Container (Stacks Admin Bar + Desktop Nav) */}
      <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col">
        
        {/* Admin VIP Bar (Shows on Mobile & Desktop if Admin) */}
        {isAdmin && (
          <Link 
            href="/admin" 
            className="w-full bg-[#2563eb] hover:bg-blue-700 text-white h-8 sm:h-9 flex items-center justify-center text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors gap-2 shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Go to Admin Dashboard
          </Link>
        )}

        {/* Desktop Top Nav */}
        <nav className="hidden sm:block w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
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
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] w-full bg-[#111827] border-t border-gray-800 pb-[env(safe-area-inset-bottom)]">
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