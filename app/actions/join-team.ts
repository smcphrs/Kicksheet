'use server'

import { createClient } from '@supabase/supabase-js'

export async function joinTeamAction(data: {
  teamId: string
  firstName: string
  lastName: string
  number: string
  positions: string[]
  kickingStyle: string
}) {
  // Initialize Supabase with the SERVICE ROLE KEY to safely bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  )

  const { teamId, firstName, lastName, number, positions, kickingStyle } = data

  const { error } = await supabaseAdmin
    .from('players')
    .insert([
      {
        team_id: teamId,
        name: `${firstName} ${lastName}`.trim(),
        number: number || null,
        // Ensure you add these columns to your Supabase 'players' table!
        positions: positions,
        kicking_style: kickingStyle || null,
        is_registered: true
      }
    ])

  if (error) {
    console.error('Failed to insert player:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}