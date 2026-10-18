import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { LogOut } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kicksheet',
  description: 'Manage your kickball team, roster, and field positions.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 min-h-screen flex flex-col`}>
        {session && (
          <nav className="bg-white border-b sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center gap-8">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <span className="text-xl font-bold text-blue-600 tracking-tight">Kicksheet</span>
                  </Link>
                  <div className="hidden sm:flex space-x-6">
                    <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                      Dashboard
                    </Link>
                    <Link href="/games/past" className="text-gray-600 hover:text-gray-900 font-medium">
                      Past Games
                    </Link>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <form action="/auth/signout" method="post">
                    <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">Sign Out</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </nav>
        )}
        
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </body>
    </html>
  )
}