'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Calendar, Clock, MapPin, Users, Cloud, ArrowLeft, Download, Loader2, Edit, Map, X, Share2, Megaphone, Info } from 'lucide-react'
import { toBlob } from 'html-to-image'
import { useTheme } from 'next-themes'
import { FieldMapModal } from '@/components/FieldMapModal'

function LineupContent() {
  const params = useParams()
  const id = params.id as string

  const supabase = createClient()
  const { resolvedTheme } = useTheme()
  
  const [game, setGame] = useState<any>(null)
  const [orderedPlayers, setOrderedPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [showFieldMap, setShowFieldMap] = useState(false)
  
  const [highlight, setHighlight] = useState<string | null>(null)
  
  const captureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    
    async function fetchGame() {
      const { data: gameData, error } = await supabase
        .from('games')
        .select('*, teams (name)')
        .eq('id', id)
        .single()
        
      if (!gameData || error) return
      setGame(gameData)
      
      const regularIds = (gameData.kicking_order || []).filter((pid: string) => !pid.startsWith('sub-'))
      let roster: any[] = []
      if (regularIds.length > 0) {
         const { data: players } = await supabase
          .from('players')
          .select('id, name, number')
          .in('id', regularIds)
         if (players) roster = players
      }

      const ordered = (gameData.kicking_order || []).map((pid: string) => {
        if (pid.startsWith('sub-')) {
           return (gameData.subs || []).find((s: any) => s.id === pid) || { id: pid, name: 'Unknown Sub', isSub: true }
        }
        return roster.find(p => p.id === pid) || { id: pid, name: 'Unknown Player' }
      })
      
      setOrderedPlayers(ordered)
      setLoading(false)
    }
    fetchGame()
  }, [id, supabase])

  const handleDownload = async () => {
    if (!captureRef.current) return
    setDownloading(true)
    
    try {
      const prevHighlight = highlight
      setHighlight(null)
      
      await new Promise(resolve => setTimeout(resolve, 100))

      const blob = await toBlob(captureRef.current, { 
        quality: 1,
        backgroundColor: resolvedTheme === 'dark' ? '#030712' : '#f8f9fa',
        pixelRatio: 2 
      })
      
      setHighlight(prevHighlight)

      if (!blob) throw new Error("Failed to generate blob")

      const opponent = game?.opposing_team ? game.opposing_team.replace(/\s+/g, '_') : 'TBD'
      const gameDate = game?.game_date || 'Unknown_Date'
      const fileName = `vs_${opponent}_${gameDate}.png`
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
    } catch (err) {
      console.error("Failed to capture image", err)
      alert("Failed to capture image. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  const getPosition = (inning: number, playerId: string) => {
     const innData = (game?.innings || []).find((i: any) => i.inning === inning)
     return innData?.assignments?.[playerId] || 'OUT'
  }

  const getPositionColors = (pos: string) => {
    switch (pos) {
      case 'LF': return 'bg-[#3730a3] text-white' 
      case 'LC': return 'bg-[#0284c7] text-white' 
      case 'RC': return 'bg-[#00be99] text-white' 
      case 'RF': return 'bg-[#16a34a] text-white'
      case 'P':  return 'bg-[#ec0000] text-white'
      case 'C':  return 'bg-[#9942cc] text-white' 
      case '1B': return 'bg-[#ff6a66] text-white' 
      case '2B': return 'bg-[#ff8800] text-white' 
      case '3B': return 'bg-[#e3005c] text-white' 
      case 'SS': return 'bg-[#dbcc07] text-white' 
      case 'Bench':
      case 'OUT': return 'bg-[#757575] text-white' 
      default: return 'bg-gray-400 dark:bg-gray-600 text-white'
    }
  }

  const formatName = (name: string) => {
    const parts = name.split(' ')
    if (parts.length > 1) {
       return `${parts[0]} ${parts[parts.length - 1][0]}.`
    }
    return name
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD'
    const [hourString, minute] = timeString.split(':')
    const hour = parseInt(hourString, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minute} ${ampm}`
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-gray-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  const numInnings = game.innings && game.innings.length > 0 ? game.innings.length : 7
  const INNINGS = Array.from({ length: numInnings }, (_, i) => i + 1)
  
  const formattedDate = game.game_date 
    ? new Date(game.game_date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown Date'

  return (
    <div className="bg-[#f8f9fa] dark:bg-gray-950 min-h-[100dvh] font-sans pb-10 transition-colors sm:pt-16">
      <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-300 dark:border-gray-800 transition-colors gap-3 sm:gap-0">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Link href="/games" className="inline-flex items-center text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
          
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 hidden sm:block"></div>
          
          <Link href={`/games/${game.id}/edit`} className="inline-flex items-center text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors">
            <Edit className="w-4 h-4 mr-1" />
            Details
          </Link>
          
          <Link href={`/games/new/attendance?id=${game.id}`} className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors">
            <Users className="w-4 h-4 mr-1" />
            Lineup
          </Link>

          <Link href={`/share/${game.id}`} target="_blank" className="inline-flex items-center text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ml-1">
            <Share2 className="w-3.5 h-3.5 mr-1.5" />
            Public Link
          </Link>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-end">
          <button 
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 sm:mr-1.5 animate-spin" /> : <Download className="w-4 h-4 sm:mr-1.5" />}
            <span className="hidden sm:inline">Save Image</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full" ref={captureRef}>
        <div className="px-2 sm:px-6 pt-2 sm:pt-6">
          
          {/* Tightened Header Card */}
          <div className="bg-[#2563eb] text-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl mb-3 border border-blue-700">
            <div className="inline-flex items-center px-3 py-0.5 bg-white/20 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full mb-1.5 border border-white/30">
              {game?.teams?.name || 'Your Team'}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2 flex items-baseline gap-1.5 sm:gap-2">
              <span className="text-blue-200 text-xl sm:text-2xl font-bold">vs</span> 
              {game.opposing_team || 'TBD'}
            </h1>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-blue-50 font-bold text-sm sm:text-base">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 opacity-90" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 opacity-90" />
                <span>{formatTime(game.game_time)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 opacity-90" />
                <span>{game.location || 'Unknown'} {game.field ? `• ${game.field}` : ''}</span>
              </div>
              {game.weather && (
                <div className="flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 opacity-90" />
                  <span>{game.weather}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 opacity-90" />
                <span>{orderedPlayers.length} players</span>
              </div>
            </div>
          </div>

          {/* Tightened Notes Box */}
          {game.notes && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-3 mb-3 flex items-start gap-3">
              <div className="bg-red-100 dark:bg-red-900/50 p-1.5 rounded-full shrink-0 mt-0.5">
                <Megaphone className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-red-800 dark:text-red-200 text-sm sm:text-base font-bold whitespace-pre-wrap leading-tight">
                  {game.notes}
                </p>
              </div>
            </div>
          )}

          {/* Lineup Header & Tooltip */}
          <div className="flex items-center justify-between mb-1.5 px-1">
            <div className="relative group flex items-center cursor-help">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5">
                Lineup
                <Info className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              </h2>
              <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                Tap a name to highlight only that row, or tap an Inning number to highlight only that column.
                <div className="absolute -top-1 left-6 w-3 h-3 bg-gray-900 dark:bg-white rotate-45"></div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowFieldMap(true)}
              className="inline-flex items-center justify-center px-3 py-1 text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 shadow-sm"
            >
              Field Map
            </button>
          </div>

          {/* Tightened High-Legibility Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden transition-colors border border-gray-300 dark:border-gray-700 shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#2563eb] text-white text-xs sm:text-sm font-black tracking-tight border-b-2 border-blue-800">
                <tr>
                  <th 
                    onClick={() => setHighlight(prev => prev === 'col_order' ? null : 'col_order')}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2.5 w-[90px] sm:w-[150px] cursor-pointer select-none transition-colors ${highlight === 'col_order' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                  >
                    Order
                  </th>
                  {INNINGS.map(i => (
                    <th 
                      key={i} 
                      onClick={() => setHighlight(prev => prev === `col_${i}` ? null : `col_${i}`)}
                      className={`px-0.5 sm:px-1 py-1.5 sm:py-2.5 text-center min-w-[30px] sm:min-w-[50px] cursor-pointer select-none transition-colors ${highlight === `col_${i}` ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                    >
                      {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-gray-900 dark:text-gray-100">
                {orderedPlayers.map((player: any, idx: number) => {
                  const isEven = idx % 2 === 0
                  const rowBg = isEven ? 'bg-white dark:bg-gray-900' : 'bg-blue-50/30 dark:bg-gray-800/40'
                  
                  const isRowDimmed = highlight?.startsWith('player_') && highlight !== `player_${player.id}`
                  const isRowHighlighted = highlight === `player_${player.id}`
                  
                  return (
                    <tr 
                      key={player.id} 
                      onClick={() => setHighlight(prev => prev === `player_${player.id}` ? null : `player_${player.id}`)}
                      className={`${rowBg} transition-all duration-200 cursor-pointer ${
                        isRowDimmed ? 'opacity-25 grayscale' : 'opacity-100'
                      } ${isRowHighlighted ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
                    >
                      <td className={`px-2 sm:px-3 py-1 sm:py-2 ${rowBg} truncate max-w-[90px] sm:max-w-[150px] border-r border-gray-200 dark:border-gray-800`}>
                        <span className="text-[13px] sm:text-base font-black tracking-tight leading-none">
                          {formatName(player.name)}
                        </span>
                      </td>
                      
                      {INNINGS.map(inning => {
                         let pos = getPosition(inning, player.id)
                         if (pos === 'Bench') pos = 'OUT'
                         const colors = getPositionColors(pos)
                         
                         const isCellDimmedByCol = highlight === 'col_order' || (highlight?.startsWith('col_') && highlight !== 'col_order' && highlight !== `col_${inning}`)
                         
                         return (
                           <td key={inning} className={`px-0.5 sm:px-1 py-1 sm:py-1.5 text-center align-middle border-r border-gray-200 dark:border-gray-800 last:border-r-0 ${isCellDimmedByCol ? 'opacity-25 grayscale' : 'opacity-100'}`}>
                             <span className={`inline-flex items-center justify-center w-[30px] h-[20px] sm:w-[44px] sm:h-[26px] rounded sm:rounded-md text-[10px] sm:text-xs font-black uppercase tracking-tighter sm:tracking-tight ${colors} shadow-sm`}>
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

          {/* Tightened Key */}
          <div className="mt-3 sm:mt-5 mb-4 px-1">
            <h3 className="text-[10px] sm:text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Key</h3>
            <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300">
              {[
                { abbr: 'RC', name: 'Right Center' }, { abbr: 'P', name: 'Pitcher' }, { abbr: 'C', name: 'Catcher' },
                { abbr: '1B', name: '1st Base' }, { abbr: 'SS', name: 'Shortstop' }, { abbr: 'RF', name: 'Right Field' },
                { abbr: '3B', name: '3rd Base' }, { abbr: '2B', name: '2nd Base' }, { abbr: 'LF', name: 'Left Field' },
                { abbr: 'LC', name: 'Left Center' }, 
              ].map(item => (
                <div key={item.abbr} className="flex items-center gap-1">
                  <span className={`inline-flex items-center justify-center w-[20px] h-[14px] sm:w-[28px] sm:h-[18px] rounded text-[8px] sm:text-[10px] font-black text-white ${getPositionColors(item.abbr)}`}>
                    {item.abbr}
                  </span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-600 pb-2">
            Created using Kicksheet
          </div>
        </div>
      </div>

      <FieldMapModal isOpen={showFieldMap} onClose={() => setShowFieldMap(false)} />
    </div>
  )
}

export default function GameLineupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    }>
      <LineupContent />
    </Suspense>
  )
}