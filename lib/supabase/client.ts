import { createBrowserClient } from '@supabase/ssr'
// import { Database } from '@/types/supabase' // We will wire up the types next

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}