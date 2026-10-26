import { ThemeProvider } from '@/components/ThemeProvider'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { LogOut } from 'lucide-react'
import Navigation from '@/components/Navigation'
import { Suspense } from 'react'


export const instant = false

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Kicksheet',
  description: 'Manage your kickball team, roster, and field positions.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={<div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800" />}>
          <Navigation />
          </Suspense>
          <main>
    {children}
    </main>

  </ThemeProvider>
</body>
    </html>
  )
}