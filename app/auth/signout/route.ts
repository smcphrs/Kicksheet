import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Check if a session exists before attempting to sign out
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    await supabase.auth.signOut()
  }

  // Redirect to the login page after signing out
  return NextResponse.redirect(new URL('/login', request.url), {
    status: 302,
  })
}