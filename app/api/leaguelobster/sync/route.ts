import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username, password } = await request.json()

    // 1. Fetch the Auth Token
    const loginRes = await fetch('https://scheduler.leaguelobster.com/api/access-token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    if (!loginRes.ok) throw new Error('Invalid LeagueLobster credentials')
    const { token } = await loginRes.json()

    const authHeaders = {
      'Authorization': `JWT ${token}`,
      'Content-Type': 'application/json'
    }

    // 2. Fetch Teams 
    // LeagueLobster requires us to fetch teams first, before we can fetch matches.
    const teamsRes = await fetch('https://scheduler.leaguelobster.com/api/team/', { headers: authHeaders })
    if (!teamsRes.ok) throw new Error('Failed to download teams from LeagueLobster')
    
    const teamsData = await teamsRes.json()
    // Handle standard arrays or paginated { results: [] } formats
    const llTeams = Array.isArray(teamsData) ? teamsData : (teamsData.results || [])
    
    if (llTeams.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No teams found on LeagueLobster." })
    }

    // 3. Format and Upsert Teams to Supabase
    const formattedTeams = llTeams.map((t: any) => ({
      leaguelobster_id: `${user.id}_${t.id}`, 
      name: t.name || t.title || 'Unnamed Team',
      owner_id: user.id
    }))

    if (formattedTeams.length > 0) {
      const { error: teamError } = await supabase
        .from('teams')
        .upsert(formattedTeams, { onConflict: 'leaguelobster_id' })
      if (teamError) throw teamError
    }

    // 4. Fetch Matches for each team
    // First, map the Kicksheet Team IDs we just ensured exist so we can link the games to them
    const { data: userTeams } = await supabase
      .from('teams')
      .select('id, leaguelobster_id')
      .eq('owner_id', user.id)

    const teamMap = new Map(userTeams?.map(t => [t.leaguelobster_id, t.id]))

    let allMatches: any[] = []

    // Loop through each LeagueLobster team to grab their specific schedule
    for (const team of llTeams) {
      const matchesRes = await fetch(`https://scheduler.leaguelobster.com/api/team/${team.id}/matches/`, { headers: authHeaders })
      
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json()
        const teamMatches = Array.isArray(matchesData) ? matchesData : (matchesData.results || [])
        
        const kicksheetTeamId = teamMap.get(`${user.id}_${team.id}`)
        
        teamMatches.forEach((m: any) => {
          // Intelligently figure out who the opponent is
          const homeName = m.home_team_name || m.home_team?.name || ''
          const awayName = m.away_team_name || m.away_team?.name || ''
          
          let opponent = 'TBD'
          if (homeName && homeName !== team.name) opponent = homeName
          else if (awayName && awayName !== team.name) opponent = awayName

          allMatches.push({
            leaguelobster_match_id: `${user.id}_${m.id}`,
            user_id: user.id,
            team_id: kicksheetTeamId || null,
            game_date: m.start_date || m.date || null, 
            game_time: m.start_time || m.time || null,
            location: m.venue_name || m.venue?.name || null,
            opposing_team: opponent,
          })
        })
      }
    }

    // Remove potential duplicates in case teams play each other
    const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.leaguelobster_match_id, m])).values())

    // 5. Save everything to the database
    if (uniqueMatches.length > 0) {
      const { error: gameError } = await supabase
        .from('games')
        .upsert(uniqueMatches, { onConflict: 'leaguelobster_match_id' })
      if (gameError) throw gameError
    }

    return NextResponse.json({ success: true, count: uniqueMatches.length })

  } catch (error: any) {
    console.error('LL Sync Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
