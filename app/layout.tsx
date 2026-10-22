import Navigation from '@/components/Navigation'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { LogOut } from 'lucide-react'
import { ThemeProvider } from '@/components/ThemeProvider'

export const instant = false

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
    
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
  <Navigation />
  {/* pb-20 adds space for mobile bottom nav, sm:pt-20 adds space for desktop top nav */}
  <main className="pb-20 sm:pb-0 sm:pt-20">
    {children}
  </main>
  </ThemeProvider>
</body>
    </html>
  )
}