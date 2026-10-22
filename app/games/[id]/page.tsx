import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, MapPin, Flag } from 'lucide-react'

export default async function GameLineupPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: game, error } = await supabase
    .from('games')
    .select('*, teams (name)')
    .eq('id', id)
    .single()

  if (error || !game) {
    notFound()
  }

  const regularIds = (game.kicking_order || []).filter((pid: string) => !pid.startsWith('sub-'))
  
  let roster: any[] = []
  if (regularIds.length > 0) {
     const { data: players } = await supabase
      .from('players')
      .select('id, name, number')
      .in('id', regularIds)
     if (players) roster = players
  }

  const orderedPlayers = (game.kicking_order || []).map((pid: string) => {
    if (pid.startsWith('sub-')) {
       return (game.subs || []).find((s: any) => s.id === pid) || { id: pid, name: 'Unknown Sub', isSub: true }
    }
    return roster.find(p => p.id === pid) || { id: pid, name: 'Unknown Player' }
  })

  const getPosition = (inning: number, playerId: string) => {
     const innData = (game.innings || []).find((i: any) => i.inning === inning)
     return innData?.assignments?.[playerId] || 'Bench'
  }

  const getPositionColors = (pos: string) => {
    switch (pos) {
      case 'Bench': 
        return 'bg-slate-600 text-white border border-slate-700'
      case 'P': 
        return 'bg-rose-600 text-white border border-rose-700'
      case 'C': 
        return 'bg-rose-800 text-white border border-rose-900'
      case '1B': 
        return 'bg-amber-600 text-white border border-amber-700'
      case '2B': 
        return 'bg-amber-700 text-white border border-amber-800'
      case '3B': 
        return 'bg-orange-600 text-white border border-orange-700'
      case 'SS': 
        return 'bg-orange-800 text-white border border-orange-900'
      case 'LF': 
        return 'bg-emerald-600 text-white border border-emerald-700'
      case 'LC': 
        return 'bg-emerald-700 text-white border border-emerald-800'
      case 'RC': 
        return 'bg-teal-600 text-white border border-teal-700'
      case 'RF': 
        return 'bg-teal-800 text-white border border-teal-900'
      default: 
        return 'bg-blue-600 text-white border border-blue-700'
    }
  }

  const numInnings = game.innings && game.innings.length > 0 ? game.innings.length : 7
  const INNINGS = Array.from({ length: numInnings }, (_, i) => i + 1)
  
  const formattedDate = game.game_date 
    ? new Date(game.game_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown Date'

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 w-full space-y-6 sm:space-y-8 pb-24">
      <Link href="/games" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Games
      </Link>

      <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              {game.teams?.name} <span className="text-gray-400 font-medium mx-1 sm:mx-2">vs</span> {game.opposing_team || 'TBD'}
            </h1>
            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full">
              Scheduled
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">{game.game_time || 'TBD'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">{game.location || 'No Location'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Flag className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">{game.field || 'No Field'}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Master Lineup</h2>
          <span className="text-xs sm:text-sm font-bold text-gray-500">{orderedPlayers.length} Players</span>
        </div>

        {/* Changed from overflow-x-auto to highly compact mobile tables */}
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 uppercase font-bold tracking-wider border-b border-gray-200">
              <tr>
                {/* Combined # and Player column for space saving */}
                <th className="pl-3 pr-2 sm:px-4 py-3 sticky left-0 bg-gray-50 z-20 border-r border-gray-200 w-[110px] sm:w-[180px] shadow-[2px_0_8px_rgba(0,0,0,0.03)] text-[10px] sm:text-xs">
                  Player
                </th>
                {INNINGS.map(i => (
                  <th key={i} className="p-1 sm:px-4 sm:py-3 text-center w-[34px] sm:w-auto">
                    {/* Only show "1", "2" on mobile, "Inn 1" on desktop */}
                    <span className="text-[10px] sm:text-xs sm:hidden">{i}</span>
                    <span className="hidden sm:inline text-xs">Inn {i}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orderedPlayers.map((player: any, idx: number) => (
                <tr key={player.id} className="hover:bg-blue-50/50 transition-colors group">
                  
                  {/* Compact combined Name + Number column */}
                  <td className="pl-2 pr-1 sm:px-4 py-1.5 sm:py-3 sticky left-0 bg-white group-hover:bg-blue-50/50 border-r border-gray-100 z-10 shadow-[2px_0_8px_rgba(0,0,0,0.03)] transition-colors">
                    <div className="flex items-center gap-1.5 sm:gap-3 w-[100px] sm:w-[160px]">
                      <span className="text-[9px] sm:text-xs font-bold text-gray-400 w-3 sm:w-5 text-right shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm truncate leading-tight">
                          {player.name}
                        </span>
                        {player.isSub && (
                          <span className="mt-0.5 text-[8px] sm:text-[10px] uppercase bg-blue-100 text-blue-700 px-1 py-0.5 rounded flex items-center w-fit leading-none">
                            Sub
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  {/* Compact Position Badges */}
                  {INNINGS.map(inning => {
                     const pos = getPosition(inning, player.id);
                     const colors = getPositionColors(pos);
                     return (
                       <td key={inning} className="p-0.5 sm:px-4 sm:py-3 text-center">
                         <span className={`inline-flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl font-bold text-[9px] sm:text-xs transition-colors shadow-sm tracking-tighter sm:tracking-normal ${colors}`}>
                           {pos}
                         </span>
                       </td>
                     )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}