import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, UserPlus, Edit2, Shield, Users } from 'lucide-react'
import { DeletePlayerButton } from '@/components/DeletePlayerButton'

const getPosAbbr = (pos: string) => {
  const map: Record<string, string> = {
    'Pitcher': 'P', 'Catcher': 'C',
    'First Base': '1B', '1st Base': '1B',
    'Second Base': '2B', '2nd Base': '2B',
    'Third Base': '3B', '3rd Base': '3B',
    'Shortstop': 'SS', 'Left Field': 'LF',
    'Left Center': 'LC', 'Right Center': 'RC', 'Right Field': 'RF',
  }
  return map[pos] || pos
}

const getPositionColors = (pos: string) => {
    switch (pos) {
      // OUTFIELD (Cool Colors: Blues, Teals, Greens)
      case 'LF': return 'bg-[#1e40af] text-white' 
      case 'LC': return 'bg-[#03a9f4] text-white' 
      case 'RC': return 'bg-[#009688] text-white' 
      case 'RF': return 'bg-[#43a047] text-white' 

      // INFIELD (Warm Colors: Reds, Pinks, Oranges, Yellows)
      case 'P': return 'bg-[#dd0000] text-white'  
      case 'C': return 'bg-[#c2185b] text-white'  
      case '1B': return 'bg-[#e65100] text-white' 
      case '2B': return 'bg-[#ff9800] text-white' 
      case '3B': return 'bg-[#fdd835] text-gray-900' 
      case 'SS': return 'bg-[#ff5252] text-white' 

      // NEUTRAL
      case 'Bench':
      case 'OUT': return 'bg-[#757575] text-white' 
      default: return 'bg-gray-400 dark:bg-gray-600 text-white'
    }
  }

export default async function TeamRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single()

  if (teamError || !team) notFound()

  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', id)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 pt-12 sm:pt-24 w-full space-y-6 sm:space-y-8 pb-24 font-sans">
        
        <Link href="/teams" className="inline-flex items-center text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Teams
        </Link>

        <header className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#2563eb] text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-blue-700 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 overflow-hidden">
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-7 h-7 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">{team.name}</h1>
              <p className="text-blue-100 font-bold mt-1 tracking-tight">{players?.length || 0} Active Players</p>
            </div>
          </div>
          
          <div className="relative z-10 flex gap-2 w-full sm:w-auto">
            <Link 
              href={`/teams/${team.id}/edit`}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-3 bg-blue-800/50 hover:bg-blue-800 border border-blue-700 text-white font-bold rounded-xl transition-colors active:scale-95"
            >
              Edit Team
            </Link>
            <Link 
              href={`/players/new?team_id=${team.id}`}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-3 bg-white text-[#0a192f] hover:bg-gray-100 font-bold rounded-xl transition-colors active:scale-95"
            >
              <UserPlus className="w-5 h-5 mr-2 text-[#2563eb]" />
              Add Player
            </Link>
          </div>
        </header>

        <div>
          {/* Structural Section Header */}
          <div className="w-full bg-gray-300/60 dark:bg-black/40 border border-blue-400/40 dark:border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between mb-4">
            <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
              Roster
            </h2>
          </div>
          
          {!players || players.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 p-10 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl transition-colors">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No players yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto font-medium">Add your first player to start building your lineup.</p>
              <Link 
                href={`/players/new?team_id=${team.id}`}
                className="inline-flex bg-[#0a192f] dark:bg-blue-200 text-white dark:text-[#0a192f] border border-gray-300 dark:border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-blue-300 transition-colors active:scale-95"
              >
                Add First Player
              </Link>
            </div>
          ) : (
            <div className="grid gap-3">
              {players.map((player) => {
                const rawPositions = player.preferred_positions || []
                const uniqueAbbrs = Array.from(new Set(rawPositions.map((pos: string) => getPosAbbr(pos))))

                return (
                  <div key={player.id} className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-2xl border border-gray-300 dark:border-gray-700 flex items-center justify-between gap-3 sm:gap-4 group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* ONLY show the number block if a number exists */}
                      {player.number && (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 font-black text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                          {player.number}
                        </div>
                      )}
                      
                      <div className="flex-1 truncate">
                        <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white tracking-tight truncate">{player.name}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {uniqueAbbrs.length > 0 ? (
                            uniqueAbbrs.map((abbr) => {
                              const colors = getPositionColors(abbr as string);
                              return (
                                <span key={abbr as string} className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded text-[10px] sm:text-xs font-bold transition-colors uppercase tracking-wider ${colors}`}>
                                  {abbr as string}
                                </span>
                              )
                            })
                          ) : (
                            <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">No preferred positions</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Discreet Actions Container */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <Link 
                        href={`/players/${player.id}/edit`}
                        className="p-2 sm:p-2.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all active:scale-95 shrink-0"
                        title="Edit Player"
                      >
                        <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </Link>
                      
                      <DeletePlayerButton playerId={player.id} playerName={player.name} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}