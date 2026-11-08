'use server'

import { createClient } from '@supabase/supabase-js'

// 1. New function to securely fetch the team's public info for the onboarding form
export async function getTeamDetailsAction(teamId: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  )

  const { data, error } = await supabaseAdmin
    .from('teams')
    .select('id, name, logo_url')
    .eq('id', teamId)
    .single()

  if (error) {
    console.error('Failed to fetch team:', error)
    return null
  }
  return data
}

// 2. Your existing function to securely add the player
export async function joinTeamAction(data: {
  teamId: string
  firstName: string
  lastName: string
  number: string
  positions: string[]
  kickingStyle: string
  experienceLevel: string // NEW
}) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! 
  )

  const { teamId, firstName, lastName, number, positions, kickingStyle, experienceLevel } = data

  const { error } = await supabaseAdmin
    .from('players')
    .insert([
      {
        team_id: teamId,
        name: `${firstName} ${lastName}`.trim(),
        number: number || null,
        positions: experienceLevel === 'New' ? [] : positions,
        kicking_style: experienceLevel === 'New' ? null : (kickingStyle || null),
        experience_level: experienceLevel || 'Experienced',
        is_registered: true
      }
    ])

  if (error) {
    console.error('Failed to insert player:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}