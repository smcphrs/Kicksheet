import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // 1. Verify the active Kicksheet User
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username, password } = await request.json()

    // 2. Fetch the Auth Token from LeagueLobster
    const loginRes = await fetch('https://scheduler.leaguelobster.com/api-token-auth/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    if (!loginRes.ok) throw new Error('Invalid LeagueLobster credentials')
    const { token } = await loginRes.json()

    // 3. Fetch Matches using the new token
    // Note: You may need to adjust this endpoint based on their exact documentation
    const matchesRes = await fetch('https://scheduler.leaguelobster.com/api/v1/matches/', {
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!matchesRes.ok) throw new Error('Failed to download schedule')
    const matches = await matchesRes.json()

    // 4. Extract and Upsert Teams
    const uniqueTeamNames = Array.from(new Set(matches.map((m: any) => m.home_team_name)))
    const formattedTeams = uniqueTeamNames.map(name => ({
      leaguelobster_id: `${user.id}_${name}`, // Scope ID to this user to prevent global collisions
      name: name as string,
      owner_id: user.id
    }))

    if (formattedTeams.length > 0) {
      const { error: teamError } = await supabase
        .from('teams')
        .upsert(formattedTeams, { onConflict: 'leaguelobster_id' })
      if (teamError) throw teamError
    }

    // 5. Extract and Upsert Games
    // First, fetch the newly created teams so we can map their Kicksheet IDs to the games
    const { data: userTeams } = await supabase
      .from('teams')
      .select('id, name')
      .eq('owner_id', user.id)

    const teamMap = new Map(userTeams?.map(t => [t.name, t.id]))

    const formattedGames = matches.map((m: any) => ({
      leaguelobster_match_id: m.id,
      user_id: user.id,
      team_id: teamMap.get(m.home_team_name) || null,
      game_date: m.start_date, 
      game_time: m.start_time,
      location: m.venue_name,
      opposing_team: m.away_team_name,
    }))

    if (formattedGames.length > 0) {
      const { error: gameError } = await supabase
        .from('games')
        .upsert(formattedGames, { onConflict: 'leaguelobster_match_id' })
      if (gameError) throw gameError
    }

    return NextResponse.json({ success: true, count: matches.length })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
