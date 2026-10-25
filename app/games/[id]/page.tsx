import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, Clock, MapPin, Users, Cloud } from 'lucide-react'

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
     return innData?.assignments?.[playerId] || 'OUT'
  }

  // Exact color mapping from the reference image
  const getPositionColors = (pos: string) => {
    switch (pos) {
      case 'C': return 'bg-[#9c27b0] text-white' // Purple
      case 'RF': return 'bg-[#5e35b1] text-white' // Deep Purple
      case 'SS': return 'bg-[#43a047] text-white' // Green
      case 'LC': return 'bg-[#00acc1] text-white' // Cyan
      case 'LF': return 'bg-[#00acc1] text-white' // Cyan (using same as LC based on image)
      case 'RC': return 'bg-[#3949ab] text-white' // Blue/Indigo
      case 'P': return 'bg-[#f44336] text-white' // Red
      case '1B': return 'bg-[#f4511e] text-white' // Red-Orange
      case '2B': return 'bg-[#fb8c00] text-white' // Orange
      case '3B': return 'bg-[#fdd835] text-gray-900' // Yellow
      case 'Bench':
      case 'OUT': return 'bg-[#757575] text-white' // Dark Gray
      default: return 'bg-gray-400 text-white'
    }
  }

  const numInnings = game.innings && game.innings.length > 0 ? game.innings.length : 7
  const INNINGS = Array.from({ length: numInnings }, (_, i) => i + 1)
  
  const formattedDate = game.game_date 
    ? new Date(game.game_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown Date'

  // Truncate player name for mobile (e.g. "Andres T.")
  const formatName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
    return name;
  }

  return (
    <div className="max-w-4xl mx-auto w-full pb-24 bg-[#f8f9fa] min-h-screen font-sans">
      
      {/* Header Card */}
      <div className="bg-[#2563eb] text-white p-6 sm:p-8 rounded-b-3xl sm:rounded-3xl sm:mt-6 shadow-md mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 flex items-center gap-2">
          <span className="text-blue-200 text-2xl">vs</span> {game.opposing_team || 'TBD'}
        </h1>

        <div className="space-y-2.5 text-blue-50 font-medium text-sm sm:text-base">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 opacity-80" />
            <span>{formattedDate}</span>
            <Clock className="w-5 h-5 opacity-80 ml-2" />
            <span>{game.game_time || 'TBD'}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 opacity-80" />
            <span>{game.location || 'Unknown'} • {game.field || 'TBD'}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 opacity-80" />
            <span>{game.location || 'Unknown'} {game.field ? `• ${game.field}` : ''}</span>
          </div>
          
          {/* Only show the weather row if they entered weather data! */}
          {game.weather && (
            <div className="flex items-center gap-3">
              <Cloud className="w-5 h-5 opacity-80" />
              <span>{game.weather}</span>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 opacity-80" />
            <span>{orderedPlayers.length} players</span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Lineup</h2>

        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm hide-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            {/* Solid Blue Table Header */}
            <thead className="bg-[#2563eb] text-white text-sm font-bold">
              <tr>
                <th className="px-4 py-4 sticky left-0 bg-[#2563eb] z-20 w-[140px]">
                  Order
                </th>
                {INNINGS.map(i => (
                  <th key={i} className="px-2 py-4 text-center min-w-[50px]">
                    {i}
                  </th>
                ))}
              </tr>
            </thead>
            {/* Striped Table Body */}
            <tbody className="text-sm font-bold text-gray-800">
              {orderedPlayers.map((player: any, idx: number) => {
                // Alternating background colors (white and very light gray/blue)
                const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#f1f5f9]';
                
                return (
                  <tr key={player.id} className={`${rowBg}`}>
                    <td className={`px-4 py-3 sticky left-0 z-10 ${rowBg}`}>
                      {formatName(player.name)}
                    </td>
                    
                    {INNINGS.map(inning => {
                       let pos = getPosition(inning, player.id);
                       if (pos === 'Bench') pos = 'OUT';
                       const colors = getPositionColors(pos);
                       
                       return (
                         <td key={inning} className="px-2 py-3 text-center align-middle">
                           <span className={`inline-flex items-center justify-center w-[42px] h-[28px] rounded-md text-[11px] uppercase tracking-wide shadow-sm ${colors}`}>
                             {pos}
                           </span>
                         </td>
                       )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Position Legend / Key */}
        <div className="mt-8 mb-12">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Key</h3>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-gray-600">
            {[
              { abbr: 'RC', name: 'Right Center' },
              { abbr: 'P', name: 'Pitcher' },
              { abbr: 'C', name: 'Catcher' },
              { abbr: '1B', name: '1st Base' },
              { abbr: 'SS', name: 'Shortstop' },
              { abbr: 'RF', name: 'Right Field' },
              { abbr: '3B', name: '3rd Base' },
              { abbr: '2B', name: '2nd Base' },
              { abbr: 'LF', name: 'Left Field' },
              { abbr: 'LC', name: 'Left Center' },
              { abbr: 'OUT', name: 'Out' },
            ].map(item => (
              <div key={item.abbr} className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center w-[36px] h-[24px] rounded text-[10px] text-white shadow-sm ${getPositionColors(item.abbr)}`}>
                  {item.abbr}
                </span>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-xs font-medium text-gray-400 pb-8">
          Created using Kicksheet
        </div>
      </div>
    </div>
  )
}