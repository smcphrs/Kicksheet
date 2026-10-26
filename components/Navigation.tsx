'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Calendar, Settings, Gauge } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()

  // Hide navigation on auth pages
  if (pathname === '/login' || pathname === '/' || pathname === '/signup') {
    return null
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Gauge },
    { name: 'Teams', href: '/teams', icon: Users },
    { name: 'Games', href: '/games', icon: Calendar },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <>
      {/* Mobile Bottom Tab Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')
            const Icon = item.icon
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-900'}`}
              >
                <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Desktop Top Navigation Bar */}
      <nav className="hidden sm:block fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl text-blue-600 tracking-tight"><img src="/public/assets/kicksheet-logo.png"></div>
          <div className="flex space-x-8">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')
              const Icon = item.icon
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`flex items-center space-x-2 text-sm font-medium transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}