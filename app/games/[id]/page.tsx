import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, MapPin, Flag, User } from 'lucide-react'

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

  // NEW: Color mapping logic for field positions
  const getPositionColors = (pos: string) => {
    switch (pos) {
      case 'Bench': 
        return 'bg-gray-50 text-gray-400 border border-gray-200'
      case 'P': 
      case 'C': 
        return 'bg-rose-100 text-rose-800 border border-rose-200'
      case '1B': 
      case '2B': 
      case '3B': 
      case 'SS': 
        return 'bg-amber-100 text-amber-800 border border-amber-200'
      case 'LF': 
      case 'LC': 
      case 'RC': 
      case 'RF': 
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
      default: 
        return 'bg-blue-100 text-blue-800 border border-blue-200'
    }
  }

  const numInnings = game.innings && game.innings.length > 0 ? game.innings.length : 7
  const INNINGS = Array.from({ length: numInnings }, (_, i) => i + 1)
  
  const formattedDate = game.game_date 
    ? new Date(game.game_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown Date'

  return (
    <div className="max-w-5xl mx-auto p-6 w-full space-y-8 pb-24">
      {/* Navigation */}
      <Link href="/games" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Games
      </Link>

      {/* Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              {game.teams?.name} <span className="text-gray-400 font-medium mx-2">vs</span> {game.opposing_team || 'TBD'}
            </h1>
            <span className="inline-block mt-3 px-3 py-1 bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wider rounded-full">
              Scheduled
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm font-medium truncate">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm font-medium truncate">{game.game_time || 'TBD'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm font-medium truncate">{game.location || 'No Location'}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Flag className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm font-medium truncate">{game.field || 'No Field'}</span>
          </div>
        </div>
      </div>

      {/* Master Lineup Matrix */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-xl font-bold text-gray-900">Master Lineup</h2>
          <span className="text-sm font-bold text-gray-500">{orderedPlayers.length} Players</span>
        </div>

        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100 hide-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-4 sticky left-0 bg-gray-50 z-20 border-r border-gray-200">#</th>
                <th className="px-4 py-4 sticky left-[48px] bg-gray-50 z-20 border-r border-gray-200 min-w-[140px] shadow-[4px_0_12px_rgba(0,0,0,0.03)]">Player</th>
                {INNINGS.map(i => (
                  <th key={i} className="px-4 py-4 text-center min-w-[80px]">Inn {i}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orderedPlayers.map((player: any, idx: number) => (
                <tr key={player.id} className="hover:bg-blue-50/50 transition-colors group">
                  
                  <td className="px-4 py-3 font-bold text-gray-400 sticky left-0 bg-white group-hover:bg-blue-50/50 border-r border-gray-100 z-10 transition-colors">
                    {idx + 1}
                  </td>
                  
                  <td className="px-4 py-3 font-bold text-gray-900 sticky left-[48px] bg-white group-hover:bg-blue-50/50 border-r border-gray-100 z-10 shadow-[4px_0_12px_rgba(0,0,0,0.03)] transition-colors whitespace-nowrap">
                    <div className="flex items-center">
                      {player.name}
                      {player.isSub && (
                        <span className="ml-2 text-[10px] uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md flex items-center">
                          <User className="w-3 h-3 mr-0.5" /> Sub
                        </span>
                      )}
                    </div>
                  </td>
                  
                  {INNINGS.map(inning => {
                     const pos = getPosition(inning, player.id);
                     const colors = getPositionColors(pos);
                     return (
                       <td key={inning} className="px-4 py-3 text-center">
                         <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold text-xs transition-colors shadow-sm ${colors}`}>
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