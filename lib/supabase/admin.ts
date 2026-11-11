import { createClient } from '@supabase/supabase-js'

// 🚨 NEVER expose the service_role key to the browser (no NEXT_PUBLIC_ prefix)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)