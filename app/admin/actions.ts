'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Security Bouncer: Ensure the requester is actually an admin
async function verifyAdmin() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin === true
}

export async function adminUpdateEmail(userId: string, newEmail: string) {
  if (!(await verifyAdmin())) return { error: 'Unauthorized' }

  // email_confirm: true bypasses the verification email so the user isn't locked out
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { 
    email: newEmail,
    email_confirm: true 
  })
  if (error) return { error: error.message }
  
  revalidatePath('/admin')
  return { success: true }
}

export async function adminUpdatePassword(userId: string, newPassword: string) {
  if (!(await verifyAdmin())) return { error: 'Unauthorized' }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { 
    password: newPassword 
  })
  if (error) return { error: error.message }
  
  return { success: true }
}

export async function adminDeleteUser(userId: string) {
  if (!(await verifyAdmin())) return { error: 'Unauthorized' }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  
  revalidatePath('/admin')
  return { success: true }
}