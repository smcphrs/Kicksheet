'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Calendar, Clock, MapPin, Users, Cloud, ArrowLeft, Download, Loader2, Edit, Map, X, Share2, Megaphone } from 'lucide-react'
import { toBlob } from 'html-to-image'
import { useTheme } from 'next-themes'

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
  const [highlightedPlayer, setHighlightedPlayer] = useState<string | null>(null)
  
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
      const prevHighlight = highlightedPlayer
      setHighlightedPlayer(null)
      
      await new Promise(resolve => setTimeout(resolve, 100))

      const blob = await toBlob(captureRef.current, { 
        quality: 1,
        backgroundColor: resolvedTheme === 'dark' ? '#030712' : '#f8f9fa',
        pixelRatio: 2 
      })
      
      setHighlightedPlayer(prevHighlight)

      if (!blob) throw new Error("Failed to generate blob")

      const opponent = game?.opposing_team ? game.opposing_team.replace(/\s+/g, '_') : 'TBD'
      const gameDate = game?.game_date || 'Unknown_Date'
      const fileName = `vs_${opponent}_${gameDate}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `vs ${game?.opposing_team || 'TBD'} Lineup`,
          })
        } catch (shareErr: any) {
          console.log("User closed share sheet", shareErr)
        }
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
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
      case 'C': return 'bg-[#9c27b0] text-white' 
      case 'RF': return 'bg-[#5e35b1] text-white' 
      case 'SS': return 'bg-[#43a047] text-white' 
      case 'LC': return 'bg-[#00acc1] text-white' 
      case 'LF': return 'bg-[#00ae9c] text-white' 
      case 'RC': return 'bg-[#3949ab] text-white' 
      case 'P': return 'bg-[#f44336] text-white' 
      case '1B': return 'bg-[#f4511e] text-white' 
      case '2B': return 'bg-[#fb8c00] text-white' 
      case '3B': return 'bg-[#fdd835] text-gray-900' 
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
      <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors gap-3 sm:gap-0">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <Link href="/games" className="inline-flex items-center text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
          <Link href={`/games/${game.id}/edit`} className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Link>
          <Link href={`/share/${game.id}`} target="_blank" className="inline-flex items-center text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <Share2 className="w-3.5 h-3.5 mr-1.5" />
            Public Link
          </Link>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowFieldMap(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            <Map className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Field Map</span>
          </button>

          <button 
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 sm:mr-1.5 animate-spin" /> : <Download className="w-4 h-4 sm:mr-1.5" />}
            <span className="hidden sm:inline">Save Image</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full" ref={captureRef}>
        <div className="px-2 sm:px-6 pt-2 sm:pt-6">
          
          <div className="bg-[#2563eb] text-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl mb-4 sm:mb-8">
            <div className="inline-flex items-center px-3 py-1 bg-white/20 text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-full mb-3 sm:mb-4 border border-white/30 shadow-sm">
              {game?.teams?.name || 'Your Team'}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4 sm:mb-6 flex items-baseline gap-2 sm:gap-3">
              <span className="text-blue-200 text-2xl sm:text-4xl">vs</span> 
              {game.opposing_team || 'TBD'}
            </h1>

            <div className="space-y-1 sm:space-y-2.5 text-blue-50 font-medium text-[11px] sm:text-base">
              <div className="flex items-center gap-2 sm:gap-3">
                <Calendar className="w-3.5 h-3.5 sm:w-5 sm:h-5 opacity-80" />
                <span>{formattedDate}</span>
                <Clock className="w-3.5 h-3.5 sm:w-5 sm:h-5 opacity-80 ml-1 sm:ml-2" />
                <span>{formatTime(game.game_time)}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5 opacity-80" />
                <span>{game.location || 'Unknown'} {game.field ? `• ${game.field}` : ''}</span>
              </div>
              {game.weather && (
                <div className="flex items-center gap-2 sm:gap-3">
                  <Cloud className="w-3.5 h-3.5 sm:w-5 sm:h-5 opacity-80" />
                  <span>{game.weather}</span>
                </div>
              )}
              <div className="flex items-center gap-2 sm:gap-3">
                <Users className="w-3.5 h-3.5 sm:w-5 sm:h-5 opacity-80" />
                <span>{orderedPlayers.length} players</span>
              </div>
            </div>
          </div>

          {game.notes && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-4 sm:mb-8 flex items-start gap-3 sm:gap-4 shadow-sm">
              <div className="bg-red-100 dark:bg-red-900/50 p-2 rounded-full shrink-0">
                <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="pt-0.5">
                <p className="text-red-800 dark:text-red-200 text-sm sm:text-base font-medium whitespace-pre-wrap leading-relaxed">
                  {game.notes}
                </p>
              </div>
            </div>
          )}

          <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-2 sm:mb-4 pl-1">Lineup</h2>

          <div className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden transition-colors">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#2563eb] text-white text-[11px] sm:text-sm font-bold">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-4 w-[80px] sm:w-[140px]">Order</th>
                  {INNINGS.map(i => (
                    <th key={i} className="px-0.5 sm:px-2 py-2 sm:py-4 text-center min-w-[28px] sm:min-w-[50px]">{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[11px] sm:text-sm font-bold text-gray-800 dark:text-gray-200">
                {orderedPlayers.map((player: any, idx: number) => {
                  const isEven = idx % 2 === 0
                  const rowBg = isEven ? 'bg-white dark:bg-gray-900' : 'bg-[#f1f5f9] dark:bg-gray-800/50'
                  
                  const isDimmed = highlightedPlayer !== null && highlightedPlayer !== player.id
                  
                  return (
                    <tr 
                      key={player.id} 
                      onClick={() => setHighlightedPlayer(prev => prev === player.id ? null : player.id)}
                      className={`${rowBg} transition-all duration-300 cursor-pointer ${
                        isDimmed ? 'opacity-25 grayscale' : 'opacity-100 shadow-sm'
                      }`}
                    >
                      <td className={`px-2 sm:px-4 py-1.5 sm:py-3 ${rowBg} truncate max-w-[80px] sm:max-w-none transition-all duration-300`}>
                        {formatName(player.name)}
                      </td>
                      {INNINGS.map(inning => {
                         let pos = getPosition(inning, player.id)
                         if (pos === 'Bench') pos = 'OUT'
                         const colors = getPositionColors(pos)
                         
                         return (
                           <td key={inning} className="px-0.5 sm:px-2 py-1 sm:py-3 text-center align-middle transition-all duration-300">
                             <span className={`inline-flex items-center justify-center w-[28px] h-[18px] sm:w-[42px] sm:h-[28px] rounded sm:rounded-md text-[9px] sm:text-xs uppercase tracking-tighter sm:tracking-wide ${colors}`}>
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

          <div className="mt-4 sm:mt-8 mb-4 sm:mb-12 px-1">
            <h3 className="text-[11px] sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-3">Key</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 sm:gap-4 text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-400">
              {[
                { abbr: 'RC', name: 'Right Center' }, { abbr: 'P', name: 'Pitcher' }, { abbr: 'C', name: 'Catcher' },
                { abbr: '1B', name: '1st Base' }, { abbr: 'SS', name: 'Shortstop' }, { abbr: 'RF', name: 'Right Field' },
                { abbr: '3B', name: '3rd Base' }, { abbr: '2B', name: '2nd Base' }, { abbr: 'LF', name: 'Left Field' },
                { abbr: 'LC', name: 'Left Center' }, { abbr: 'OUT', name: 'Out' },
              ].map(item => (
                <div key={item.abbr} className="flex items-center gap-1 sm:gap-2">
                  <span className={`inline-flex items-center justify-center w-[22px] h-[14px] sm:w-[36px] sm:h-[24px] rounded text-[8px] sm:text-[11px] text-white ${getPositionColors(item.abbr)}`}>
                    {item.abbr}
                  </span>
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center text-[10px] sm:text-xs font-medium text-gray-400 dark:text-gray-500 pb-2 sm:pb-8">
            Created using Kicksheet
          </div>
        </div>
      </div>

      {/* Field Map Modal */}
      {showFieldMap && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-6 max-w-2xl w-full border border-gray-100 dark:border-gray-800 relative shadow-2xl">
            <button
              onClick={() => setShowFieldMap(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 pr-10">Field Positions</h2>
            
            <div className="rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2">
              <img 
                src="/assets/kicksheet_positions.jpg" 
                alt="Kickball Field Positions Diagram" 
                className="w-full h-auto rounded-xl"
              />
            </div>
            
            <button
              onClick={() => setShowFieldMap(false)}
              className="mt-6 w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors"
            >
              Close Map
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function GameLineupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-gray-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <LineupContent />
    </Suspense>
  )
}