import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// Helper to parse iCal date strings (e.g., "20231024T183000Z" or "TZID=...:20231024T183000")
function parseICalDate(dateStr: string) {
  if (!dateStr) return { date: null, time: null }
  const cleanDate = dateStr.split(':').pop() || '' // Remove TZID prefixes
  
  if (cleanDate.length >= 15) {
    const yyyy = cleanDate.substring(0, 4)
    const mm = cleanDate.substring(4, 6)
    const dd = cleanDate.substring(6, 8)
    const hh = cleanDate.substring(9, 11)
    const min = cleanDate.substring(11, 13)
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` }
  } else if (cleanDate.length === 8) {
    const yyyy = cleanDate.substring(0, 4)
    const mm = cleanDate.substring(4, 6)
    const dd = cleanDate.substring(6, 8)
    return { date: `${yyyy}-${mm}-${dd}`, time: null }
  }
  return { date: null, time: null }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { calendarUrl, teamId } = await request.json()
    if (!calendarUrl || !teamId) throw new Error('Calendar URL and Team ID are required.')

    // 1. Fetch the .ics file
    const res = await fetch(calendarUrl)
    if (!res.ok) throw new Error('Failed to fetch the calendar feed. Ensure the URL is public and valid.')
    
    const icalData = await res.text()

    // 2. Parse the iCal string into individual events
    const events: any[] = []
    const lines = icalData.split(/\r?\n/)
    
    let currentEvent: any = null

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {}
      } else if (line === 'END:VEVENT') {
        if (currentEvent) events.push(currentEvent)
        currentEvent = null
      } else if (currentEvent) {
        // Handle multi-line descriptions/summaries
        let fullLine = line
        while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
          i++
          fullLine += lines[i].substring(1)
        }

        const splitIndex = fullLine.indexOf(':')
        if (splitIndex > -1) {
          const key = fullLine.substring(0, splitIndex).split(';')[0] // Ignore parameters like TZID
          const value = fullLine.substring(splitIndex + 1)
          currentEvent[key] = value
        }
      }
    }

    if (events.length === 0) throw new Error('No events found in this calendar feed.')

    // 3. Fetch the team name so we can strip it out of the Summary to find the opponent
    const { data: teamData } = await supabase.from('teams').select('name').eq('id', teamId).single()
    const teamName = teamData?.name || ''

    // 4. Format games for Supabase
    const formattedGames = events.map(event => {
      const { date, time } = parseICalDate(event['DTSTART'])
      
      // Try to isolate the opponent from standard "Team A vs Team B" formats
      let opponent = event['SUMMARY'] || 'TBD'
      if (teamName) {
        opponent = opponent
          .replace(new RegExp(`\\b${teamName}\\b`, 'gi'), '') // Remove your team
          .replace(/\bvs\.?\b/gi, '') // Remove "vs"
          .replace(/\bat\b/gi, '') // Remove "at"
          .replace(/[-:]/g, '') // Remove dashes or colons
          .trim() || 'Unknown Opponent'
      }

      return {
        leaguelobster_match_id: event['UID'] || `${teamId}_${date}_${time}`, // Fallback if no UID
        user_id: user.id,
        team_id: teamId,
        game_date: date,
        game_time: time,
        location: event['LOCATION'] || null,
        opposing_team: opponent,
      }
    }).filter(g => g.game_date !== null) // Ensure we only save valid dates

    if (formattedGames.length === 0) throw new Error('Could not parse any valid game dates from this calendar.')

    // 5. Upsert into database
    const { error: gameError } = await supabase
      .from('games')
      .upsert(formattedGames, { onConflict: 'leaguelobster_match_id' })

    if (gameError) throw gameError

    return NextResponse.json({ success: true, count: formattedGames.length })

  } catch (error: any) {
    console.error('iCal Sync Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
