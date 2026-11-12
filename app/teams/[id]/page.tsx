import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, UserPlus, Edit2, Shield, Users, Crosshair } from 'lucide-react'
import { DeletePlayerButton } from '@/components/DeletePlayerButton'
import { InviteInstructions } from '@/components/InviteInstructions'

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
    case 'LF': return 'bg-[#1e40af] text-white' 
    case 'LC': return 'bg-[#03a9f4] text-white' 
    case 'RC': return 'bg-[#00be99] text-white' 
    case 'RF': return 'bg-[#43a047] text-white'
    case 'P':  return 'bg-[#ec0000] text-white'
    case 'C':  return 'bg-[#9942cc] text-white' 
    case '1B': return 'bg-[#ff6a66] text-white' 
    case '2B': return 'bg-[#ff8800] text-white' 
    case '3B': return 'bg-[#e3005c] text-white' 
    case 'SS': return 'bg-[#dbcc07] text-gray-900' 
    case 'Bench':
    case 'OUT': return 'bg-[#757575] text-white' 
    default: return 'bg-gray-400 dark:bg-gray-600 text-white'
  }
}

const parsePositions = (data: any): string[] => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    const cleaned = data.replace(/^\{|\}$|^\[|\]$/g, '').replace(/"|'/g, '')
    return cleaned.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
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

        {/* Team Banner */}
        <header className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#2563eb] text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-blue-700 overflow-hidden shadow-md">
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
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-3 sm:py-2.5 bg-blue-800/50 hover:bg-blue-800 border border-blue-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              Edit
            </Link>
            <Link 
              href={`/players/new?team_id=${team.id}`}
              className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-3 sm:py-2.5 bg-white text-[#0a192f] hover:bg-gray-100 font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <UserPlus className="w-5 h-5 mr-2 text-[#2563eb]" />
              Add Player
            </Link>
          </div>
        </header>

        {/* Collapsible Invite Instructions Component */}
        <InviteInstructions teamId={team.id} />

        {/* Roster Section */}
        <div>
          <div className="w-full flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Roster
            </h2>
          </div>
          
          {!players || players.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 p-10 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl transition-colors shadow-sm">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No players yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto font-medium">Add your first player to start building your lineup.</p>
              <Link 
                href={`/players/new?team_id=${team.id}`}
                className="inline-flex bg-[#0a192f] dark:bg-blue-200 text-white dark:text-[#0a192f] border border-gray-300 dark:border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-blue-300 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Add First Player
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {players.map((player: any) => {
                const rawPositions = [
                  ...parsePositions(player.positions), 
                  ...parsePositions(player.preferred_positions)
                ]
                const uniqueAbbrs = Array.from(new Set(rawPositions.map((pos: string) => getPosAbbr(pos))))

                return (
                  <div key={player.id} className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 flex flex-col gap-4 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                    {/* Top Row: Number, Name & Actions */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {player.number && (
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 font-black text-gray-500 dark:text-gray-400 text-xs mt-0.5 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
                            {player.number}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white leading-tight tracking-tight">
                              {player.name}
                            </h3>
                            {player.experience_level === 'New' && (
                              <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                                Newbie
                              </span>
                            )}
                          </div>
                          {player.pronouns && (
                            <span className="text-[11px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 mt-0.5 tracking-tight">
                              {player.pronouns}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-100 dark:border-gray-700/50 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Link 
                          href={`/players/${player.id}/edit`}
                          className="p-2 sm:p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all active:scale-95 shrink-0"
                          title="Edit Player"
                        >
                          <Edit2 className="w-4 h-4 sm:w-4 sm:h-4" />
                        </Link>
                        <DeletePlayerButton playerId={player.id} playerName={player.name} />
                      </div>
                    </div>

                    {/* Bottom Row: Kicking Style & Positions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex-1 min-w-[120px]">
                        {player.kicking_style ? (
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                            <Crosshair className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {player.kicking_style}
                          </p>
                        ) : (
                          <span className="text-[10px] sm:text-xs text-gray-300 dark:text-gray-700 font-bold uppercase tracking-wider">No style set</span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {uniqueAbbrs && uniqueAbbrs.length > 0 ? (
                          uniqueAbbrs.map((pos) => (
                            <span key={pos as string} className={`inline-flex items-center justify-center w-[28px] h-[20px] sm:w-[32px] sm:h-[24px] rounded-md sm:rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-tighter ${getPositionColors(pos as string)}`}>
                              {pos as string}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-bold italic tracking-tight">No positions</span>
                        )}
                      </div>
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