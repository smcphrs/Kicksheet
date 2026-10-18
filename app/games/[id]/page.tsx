import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, MapPin, Clock, Calendar, CloudRain } from 'lucide-react'
import { InningAssignment, Player } from '@/types/models'
import ShareButton from '@/components/ShareButton'

export const instant = false


export default async function GameDayView({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Fetch the specific game
  const { data: game, error: gameError } = await supabase
    .from('game_lineups')
    .select('*')
    .eq('id', params.id)
    .single()

  if (gameError || !game) {
    notFound()
  }

  // Fetch the roster for this team to map UUIDs to Player names
  const { data: roster } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', game.team_id)

  const playerMap = new Map(roster?.map(p => [p.id, p]) || [])

  // Safely cast the JSONB innings to our TypeScript interface
  const innings = (game.innings as unknown as InningAssignment[]) || []

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Navigation */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-4">
          <Link 
            href="/games/past" 
            className="p-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            vs. {game.opposing_team || 'TBD'}
          </h1>
        </div>
        
        {/* Share Button targeting the lineup container below */}
        <ShareButton targetId="lineup-container" />
      </div>

      {/* Target Container for HTML2Canvas */}
      <div id="lineup-container" className="space-y-6 bg-gray-50 p-4 -m-4 sm:p-0 sm:m-0 sm:bg-transparent rounded-xl">
        
        {/* Game Details Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 border rounded-xl shadow-sm flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Date</p>
              <p className="font-semibold text-gray-900">{new Date(game.game_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="bg-white p-4 border rounded-xl shadow-sm flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Time</p>
              <p className="font-semibold text-gray-900">{game.game_time}</p>
            </div>
          </div>
          <div className="bg-white p-4 border rounded-xl shadow-sm flex items-center gap-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div className="truncate">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Location</p>
              <p className="font-semibold text-gray-900 truncate">
                {[game.location, game.field].filter(Boolean).join(' - ') || 'TBD'}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 border rounded-xl shadow-sm flex items-center gap-3">
            <CloudRain className="w-5 h-5 text-blue-600" />
            <div className="truncate">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Weather</p>
              <p className="font-semibold text-gray-900 truncate">{game.weather || 'Unknown'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
          {/* Kicking Order Column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-gray-50 border-b px-5 py-4">
                <h2 className="text-lg font-bold text-gray-900">Kicking Order</h2>
              </div>
              <div className="divide-y">
                {game.kicking_order?.map((playerId: string, index: number) => {
                  const player = playerMap.get(playerId)
                  if (!player) return null
                  return (
                    <div key={`${playerId}-${index}`} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50 transition-colors bg-white">
                      <span className="font-bold text-gray-400 w-6 text-right">{index + 1}.</span>
                      <div>
                        <p className="font-semibold text-gray-900">{player.name}</p>
                        {player.number && <p className="text-xs text-gray-500">#{player.number}</p>}
                      </div>
                    </div>
                  )
                })}
                {(!game.kicking_order || game.kicking_order.length === 0) && (
                  <div className="p-8 text-center text-gray-500 bg-white">No kicking order set.</div>
                )}
              </div>
            </div>
          </div>

          {/* Field Positions by Inning */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Field Assignments</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {innings.map((inning) => (
                <div key={inning.inningNumber} className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-blue-50 border-b px-5 py-3">
                    <h3 className="font-bold text-blue-900">Inning {inning.inningNumber}</h3>
                  </div>
                  <div className="p-4 grid grid-cols-2 gap-3 bg-white">
                    {inning.assignments.map((assignment, idx) => {
                      const player = playerMap.get(assignment.playerId)
                      if (!player) return null
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded w-10 text-center">
                            {assignment.position}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {player.name}
                          </span>
                        </div>
                      )
                    })}
                    {inning.assignments.length === 0 && (
                      <div className="col-span-2 text-sm text-gray-500 italic">No players assigned.</div>
                    )}
                  </div>
                </div>
              ))}
              {innings.length === 0 && (
                <div className="col-span-full p-8 text-center bg-white border rounded-2xl text-gray-500">
                  No field assignments saved for this game.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}