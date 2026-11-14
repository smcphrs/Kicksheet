import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Helper function to safely catch HTML error pages
async function safeFetch(url: string, options: any) {
  const res = await fetch(url, options)
  const contentType = res.headers.get('content-type') || ''
  const text = await res.text()
  
  if (!contentType.includes('application/json')) {
    console.error(`[LeagueLobster Error] ${url} returned HTML. Status: ${res.status}`)
    return { ok: false, status: res.status, error: `Blocked request to ${url} (Status ${res.status}).` }
  }
  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(text) }
  } catch (e) {
    return { ok: false, status: res.status, error: 'Failed to parse JSON response.' }
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { username, password, action, selectedTeamIds } = await request.json()

    // 1. Fetch the Auth Token
    const loginRes = await safeFetch('https://scheduler.leaguelobster.com/api/access-token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })

    if (!loginRes.ok) throw new Error(loginRes.error || 'Invalid LeagueLobster credentials')
    const token = loginRes.data.token

    const authHeaders = {
      'Authorization': `JWT ${token}`,
      'Content-Type': 'application/json'
    }

    // --- ACTION: PREVIEW (Deep Scanner) ---
    if (action === 'preview') {
      let allTeams: any[] = []

      // Step A: Check standalone teams
      const teamsRes = await safeFetch('https://scheduler.leaguelobster.com/api/team/', { headers: authHeaders })
      if (teamsRes.ok) {
        const rootTeams = Array.isArray(teamsRes.data) ? teamsRes.data : (teamsRes.data.results || [])
        allTeams = [...rootTeams]
      }

      // Step B: Check nested teams inside Seasons
      if (allTeams.length === 0) {
        const seasonsRes = await safeFetch('https://scheduler.leaguelobster.com/api/season/', { headers: authHeaders })
        if (seasonsRes.ok) {
          const seasons = Array.isArray(seasonsRes.data) ? seasonsRes.data : (seasonsRes.data.results || [])
          
          for (const season of seasons) {
            const seasonTeamsRes = await safeFetch(`https://scheduler.leaguelobster.com/api/season/${season.id}/teams/`, { headers: authHeaders })
            if (seasonTeamsRes.ok) {
              const sTeams = Array.isArray(seasonTeamsRes.data) ? seasonTeamsRes.data : (seasonTeamsRes.data.results || [])
              allTeams = [...allTeams, ...sTeams]
            }
          }
        }
      }

      if (allTeams.length === 0) {
        throw new Error('Logged in successfully, but 0 teams were found. Note: LeagueLobster API data is only visible to League Admins, not individual Team Captains.')
      }

      // Remove duplicates just in case
      const uniqueTeams = Array.from(new Map(allTeams.map(t => [t.id, t])).values())

      return NextResponse.json({ 
        success: true, 
        teams: uniqueTeams.map((t: any) => ({ id: t.id, name: t.name || t.title || 'Unnamed Team' })) 
      })
    }

    // --- ACTION: SYNC ---
    if (action === 'sync') {
      if (!selectedTeamIds || selectedTeamIds.length === 0) {
        throw new Error('No teams selected for sync')
      }

      // We need to re-fetch the teams based on selected IDs to get their full data
      let allTeams: any[] = []
      const teamsRes = await safeFetch('https://scheduler.leaguelobster.com/api/team/', { headers: authHeaders })
      if (teamsRes.ok) {
        allTeams = [...(Array.isArray(teamsRes.data) ? teamsRes.data : (teamsRes.data.results || []))]
      }
      if (allTeams.length === 0) {
        const seasonsRes = await safeFetch('https://scheduler.leaguelobster.com/api/season/', { headers: authHeaders })
        if (seasonsRes.ok) {
          const seasons = Array.isArray(seasonsRes.data) ? seasonsRes.data : (seasonsRes.data.results || [])
          for (const season of seasons) {
            const seasonTeamsRes = await safeFetch(`https://scheduler.leaguelobster.com/api/season/${season.id}/teams/`, { headers: authHeaders })
            if (seasonTeamsRes.ok) {
              allTeams = [...allTeams, ...(Array.isArray(seasonTeamsRes.data) ? seasonTeamsRes.data : (seasonTeamsRes.data.results || []))]
            }
          }
        }
      }

      const teamsToSync = allTeams.filter((t: any) => selectedTeamIds.includes(t.id))

      // Upsert Selected Teams
      const formattedTeams = teamsToSync.map((t: any) => ({
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

      // Fetch Matches for Selected Teams
      const { data: userTeams } = await supabase
        .from('teams')
        .select('id, leaguelobster_id')
        .eq('owner_id', user.id)

      const teamMap = new Map(userTeams?.map(t => [t.leaguelobster_id, t.id]))
      let allMatches: any[] = []

      for (const team of teamsToSync) {
        const matchesRes = await safeFetch(`https://scheduler.leaguelobster.com/api/team/${team.id}/matches/`, { headers: authHeaders })
        
        if (matchesRes.ok) {
          const teamMatches = Array.isArray(matchesRes.data) ? matchesRes.data : (matchesRes.data.results || [])
          const kicksheetTeamId = teamMap.get(`${user.id}_${team.id}`)
          
          teamMatches.forEach((m: any) => {
            const homeName = m.home_team_name || m.home_team?.name || ''
            const awayName = m.away_team_name || m.away_team?.name || ''
            
            let opponent = 'TBD'
            if (homeName && homeName !== (team.name || team.title)) opponent = homeName
            else if (awayName && awayName !== (team.name || team.title)) opponent = awayName

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

      const uniqueMatches = Array.from(new Map(allMatches.map(m => [m.leaguelobster_match_id, m])).values())

      if (uniqueMatches.length > 0) {
        const { error: gameError } = await supabase
          .from('games')
          .upsert(uniqueMatches, { onConflict: 'leaguelobster_match_id' })
        if (gameError) throw gameError
      }

      return NextResponse.json({ success: true, count: uniqueMatches.length })
    }

  } catch (error: any) {
    console.error('LL Sync Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
