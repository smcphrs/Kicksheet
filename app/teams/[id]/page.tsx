import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, UserPlus, Edit2, Shield, Users } from 'lucide-react'

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
    case 'C': return 'bg-[#9c27b0] text-white' 
    case 'RF': return 'bg-[#5e35b1] text-white' 
    case 'SS': return 'bg-[#43a047] text-white' 
    case 'LC': return 'bg-[#00acc1] text-white' 
    case 'LF': return 'bg-[#00acc1] text-white' 
    case 'RC': return 'bg-[#3949ab] text-white' 
    case 'P': return 'bg-[#f44336] text-white' 
    case '1B': return 'bg-[#f4511e] text-white' 
    case '2B': return 'bg-[#fb8c00] text-white' 
    case '3B': return 'bg-[#fdd835] text-gray-900' 
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 w-full space-y-6 sm:space-y-8 pb-24 font-sans bg-[#f8f9fa] dark:bg-gray-950 min-h-screen transition-colors">
      <Link href="/teams" className="inline-flex items-center text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Teams
      </Link>

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#2563eb] text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{team.name}</h1>
            <p className="text-blue-100 font-medium mt-1">{players?.length || 0} Active Players</p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Link 
            href={`/teams/${team.id}/edit`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
          >
            Team Settings
          </Link>
          <Link 
            href={`/players/new?team_id=${team.id}`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-3 bg-white text-[#2563eb] hover:bg-gray-50 font-bold rounded-xl transition-colors"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add Player
          </Link>
        </div>
      </header>

      <div>
        <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 px-1">Roster</h2>
        
        {!players || players.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl transition-colors">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No players yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Add your first player to start building your lineup.</p>
            <Link 
              href={`/players/new?team_id=${team.id}`}
              className="inline-flex bg-white dark:bg-gray-800 text-[#2563eb] dark:text-blue-400 border border-gray-200 dark:border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                <div key={player.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] dark:bg-gray-800 flex items-center justify-center shrink-0 font-black text-gray-400 dark:text-gray-500 text-lg">
                      {player.number || '#'}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">{player.name}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {uniqueAbbrs.length > 0 ? (
                          uniqueAbbrs.map((abbr) => {
                            const colors = getPositionColors(abbr as string);
                            return (
                              <span key={abbr as string} className={`inline-flex items-center justify-center w-8 h-8 rounded text-xs font-bold transition-colors uppercase tracking-wider ${colors}`}>
                                {abbr as string}
                              </span>
                            )
                          })
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">No preferred positions</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link 
                    href={`/players/${player.id}/edit`}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}