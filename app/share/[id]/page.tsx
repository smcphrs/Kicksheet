'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { Calendar, Clock, MapPin, Cloud, Download, Loader2, Map, X, Share2, Check, Megaphone, Info, Copy, Printer, Trees } from 'lucide-react'
import { toBlob } from 'html-to-image'
import { useTheme } from 'next-themes'
import { FieldMapModal } from '@/components/FieldMapModal'

function PublicLineupContent() {
  const params = useParams()
  const id = params.id as string

  const supabase = createClient()
  const { resolvedTheme } = useTheme()
  
  const [game, setGame] = useState<any>(null)
  const [orderedPlayers, setOrderedPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [showFieldMap, setShowFieldMap] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const [highlight, setHighlight] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  
  const captureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    
    async function fetchGame() {
      const { data: gameData, error } = await supabase
        .from('games')
        .select('*, teams (name)')
        .eq('id', id)
        .single()
        
      if (!gameData || error) {
        setLoading(false)
        return
      }
      
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
      
      setTimeout(() => setMounted(true), 50)
    }
    fetchGame()
  }, [id, supabase])

  const handleDownload = async () => {
    if (!captureRef.current) return
    setDownloading(true)
    
    try {
      const prevHighlight = highlight
      setHighlight(null)
      await new Promise(resolve => setTimeout(resolve, 150))

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

  const handlePrint = () => {
    const isDark = document.documentElement.classList.contains('dark')
    if (isDark) document.documentElement.classList.remove('dark')
    
    setTimeout(() => {
      window.print()
      if (isDark) document.documentElement.classList.add('dark')
    }, 50)
  }

  const getPosition = (inning: number, playerId: string) => {
     const innData = (game?.innings || []).find((i: any) => i.inning === inning)
     return innData?.assignments?.[playerId] || 'OUT'
  }

  const getPositionColors = (pos: string) => {
    switch (pos) {
      case 'LF': return 'bg-[#3730a3] text-white' 
      case 'LC': return 'bg-[#0284c7] text-white' 
      case 'RC': return 'bg-[#0f766e] text-white' 
      case 'RF': return 'bg-[#16a34a] text-white'
      case 'P':  return 'bg-[#b91c1c] text-white'
      case 'C':  return 'bg-[#6d28d9] text-white' 
      case '1B': return 'bg-[#c2410c] text-white' 
      case '2B': return 'bg-[#d97706] text-white' 
      case '3B': return 'bg-[#9d174d] text-white' 
      case 'SS': return 'bg-[#475569] text-white' 
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

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-[#f8f9fa] dark:bg-gray-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  if (!game) return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#f8f9fa] dark:bg-gray-950 p-4 text-center">
      <Calendar className="w-12 h-12 text-gray-400 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Lineup Not Found</h1>
      <p className="text-gray-500">This game may have been deleted or the link is invalid.</p>
    </div>
  )

  const numInnings = game.innings && game.innings.length > 0 ? game.innings.length : 7
  const INNINGS = Array.from({ length: numInnings }, (_, i) => i + 1)
  
  const formattedDate = game.game_date 
    ? new Date(game.game_date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown Date'
    
  const currentUrl = typeof window !== 'undefined' ? window.location.href : ''

  return (
    <div className="bg-[#f8f9fa] dark:bg-gray-950 min-h-[100dvh] font-sans pb-10 transition-colors antialiased">
      
      {/* Print CSS Override (Fixed Turbopack issue by using standard child text) */}
      <style>
        {`
          @media print {
            @page { size: auto; margin: 0.5in; }
            body { background-color: #f8f9fa !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}
      </style>

      {/* Top Navbar */}
      <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center px-4 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-300 dark:border-gray-800 transition-colors gap-3 sm:gap-0 print:hidden">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-bold text-sm w-full sm:w-auto justify-center sm:justify-start">
          <img src="/assets/kicksheet-logo.png" alt="Logo" className="h-6 dark:hidden" />
          <img src="/assets/kicksheet-logo-white.png" alt="Logo" className="h-6 hidden dark:block" />
          <span className="tracking-tight">Lineup</span>
        </div>
        
        <div className="flex items-center justify-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowShareModal(true)}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 sm:px-6 py-2 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all active:scale-95 border border-transparent"
          >
            <Share2 className="w-4 h-4 mr-2" />
            <span>Share</span>
          </button>

          <button 
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 sm:px-6 py-2 text-xs font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            <span>{downloading ? 'Saving' : 'Save'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full print:max-w-none print:w-full print:px-0" ref={captureRef}>
        <div className={`px-2 sm:px-6 pt-2 sm:pt-6 transform transition-all duration-700 ease-out ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} print:transform-none print:opacity-100 print:px-0 print:pt-0`}>
          
          {/* Header Card */}
          <div className="bg-[#2563eb] text-white p-3 sm:p-5 rounded-2xl sm:rounded-3xl mb-3 relative overflow-hidden border border-blue-700 shadow-lg shadow-blue-900/10 print:shadow-none print:border-none">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <div className="inline-flex items-center px-3 py-0.5 bg-white/20 text-white text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full border border-white/30 backdrop-blur-sm">
                  {game?.teams?.name || 'Your Team'}
                </div>
                {game?.weather && (
                  <div className="flex items-center gap-1.5 text-blue-100 text-[13px] sm:text-xs italic opacity-100 mt-1 mr-1">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{game.weather}</span>
                  </div>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4 flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-blue-200/80 text-xl sm:text-2xl font-bold tracking-normal">vs</span> 
                {game.opposing_team || 'TBD'}
              </h1>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-200 shrink-0" />
                  <span className="text-sm font-bold text-white truncate">{formattedDate}</span>
                </div>
                <div className="bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-200 shrink-0" />
                  <span className="text-sm font-bold text-white truncate">{formatTime(game.game_time)}</span>
                </div>
                <div className="bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-200 shrink-0" />
                  <span className="text-sm font-bold text-white truncate">{game.location || 'Unknown'}</span>
                </div>
                <Trees className="bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-3 py-2 border border-white/10 flex items-center gap-2"/>
                  <span className="text-sm font-bold text-white truncate">{game.field || 'TBD'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Box */}
          {game.notes && (
            <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl p-3 mb-3 flex items-start gap-3 transition-all duration-700 delay-100 ease-out ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
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

          {/* Tooltip & Header Row */}
          <div className={`flex items-center justify-between mb-1.5 px-1 transition-all duration-700 delay-200 ease-out ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            
            <div className="relative group flex items-center cursor-help">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-1.5">
                Lineup
                {!downloading && <Info className="w-4 h-4 text-gray-400 dark:text-gray-500 print:hidden" />}
              </h2>
              
              {!downloading && (
                <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-semibold rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible group-active:opacity-100 group-active:visible transition-all z-50 pointer-events-none print:hidden">
                  For quicker sorting, tap a name to highlight only that row, or tap an Inning number to highlight only that column.
                  <div className="absolute -top-1 left-6 w-3 h-3 bg-gray-900 dark:bg-white rotate-45"></div>
                </div>
              )}
            </div>
            
            {!downloading && (
              <button 
                onClick={() => setShowFieldMap(true)}
                className="inline-flex items-center justify-center px-3 py-1 text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 shadow-sm print:hidden"
              >
                Field Map
              </button>
            )}
          </div>

          {/* High-Legibility Table */}
          <div className={`bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-700 delay-300 ease-out border border-gray-300 dark:border-gray-700 shadow-sm ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} print:shadow-none print:border-none`}>
            <table className="w-full text-left border-collapse print:w-full">
              <thead className="bg-[#2563eb] text-white text-xs sm:text-sm font-black tracking-tight border-b-2 border-blue-800">
                <tr>
                  <th 
                    onClick={() => setHighlight(prev => prev === 'col_order' ? null : 'col_order')}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2.5 w-[90px] sm:w-[150px] cursor-pointer select-none transition-colors tracking-wider ${highlight === 'col_order' ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                  >
                    Order
                  </th>
                  {INNINGS.map(i => (
                    <th 
                      key={i} 
                      onClick={() => setHighlight(prev => prev === `col_${i}` ? null : `col_${i}`)}
                      className={`px-0.5 sm:px-1 py-1.5 sm:py-2.5 text-center min-w-[30px] sm:min-w-[50px] cursor-pointer select-none transition-colors font-mono text-[13px] sm:text-base ${highlight === `col_${i}` ? 'bg-blue-800' : 'hover:bg-blue-700'}`}
                    >
                      {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-gray-900 dark:text-gray-100">
                {orderedPlayers.map((player: any, idx: number) => {
                  const isEven = idx % 2 === 0
                  const rowBg = isEven ? 'bg-white dark:bg-gray-900 print:bg-white' : 'bg-[#f8fafc] dark:bg-gray-800/40 print:bg-[#f8fafc]'
                  
                  const isRowDimmed = highlight?.startsWith('player_') && highlight !== `player_${player.id}`
                  const isRowHighlighted = highlight === `player_${player.id}`
                  
                  return (
                    <tr 
                      key={player.id} 
                      onClick={() => setHighlight(prev => prev === `player_${player.id}` ? null : `player_${player.id}`)}
                      className={`${rowBg} transition-all duration-200 cursor-pointer ${
                        isRowDimmed ? 'opacity-25 grayscale' : 'opacity-100'
                      } ${isRowHighlighted ? 'relative z-10 bg-white dark:bg-gray-800' : ''}`}
                    >
                      <td className={`px-2 sm:px-3 py-1 sm:py-2 truncate max-w-[90px] sm:max-w-[150px] transition-all duration-300 border-r border-gray-200 dark:border-gray-800 ${isRowHighlighted ? 'text-blue-700 dark:text-blue-400 font-black' : 'font-extrabold tracking-tight'}`}>
                        <span className="text-[13px] sm:text-base font-black tracking-tight leading-none">
                          {formatName(player.name)}
                        </span>
                      </td>
                      {INNINGS.map(inning => {
                         let pos = getPosition(inning, player.id)
                         if (pos === 'Bench') pos = 'OUT'
                         const colors = getPositionColors(pos)
                         
                         const isCellDimmedByCol = highlight === 'col_order' || (highlight?.startsWith('col_') && highlight !== 'col_order' && highlight !== `col_${inning}`)
                         const isCellHighlighted = highlight === `col_${inning}`
                         
                         return (
                           <td key={inning} className={`px-0.5 sm:px-1 py-1 sm:py-1.5 text-center align-middle transition-all duration-300 border-r border-gray-200 dark:border-gray-800 last:border-r-0 ${isCellDimmedByCol ? 'opacity-25 grayscale' : 'opacity-100'} ${isCellHighlighted ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                             <span className={`inline-flex items-center justify-center w-[30px] h-[20px] sm:w-[44px] sm:h-[26px] rounded sm:rounded-md text-[10px] sm:text-xs font-black uppercase tracking-tighter sm:tracking-tight ${colors} ${isCellHighlighted || isRowHighlighted ? 'ring-2 ring-white/20 dark:ring-black/20' : ''}`}>
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

          {/* Legend */}
          <div className={`mt-3 sm:mt-5 mb-4 px-1 transition-all duration-700 delay-500 ease-out ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} print:break-inside-avoid`}>
            <h3 className="text-[10px] sm:text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Legend</h3>
            <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300">
              {[
                 { abbr: 'P', name: 'Pitcher' }, 
                { abbr: '1B', name: '1st Base' }, 
               { abbr: '2B', name: '2nd Base' }, { abbr: 'SS', name: 'Short Stop' }, { abbr: '3B', name: '3rd Base' }, { abbr: 'RF', name: 'Right Field' }, { abbr: 'RC', name: 'Right Center' }, { abbr: 'LF', name: 'Left Field' },
                { abbr: 'LC', name: 'Left Center' }, { abbr: 'C', name: 'Catcher' },
              ].map(item => (
                <div key={item.abbr} className="flex items-center gap-1">
                  <span className={`inline-flex items-center justify-center w-[20px] h-[14px] sm:w-[28px] sm:h-[18px] rounded text-[8px] sm:text-[10px] font-black text-white tracking-tighter ${getPositionColors(item.abbr)}`}>
                    {item.abbr}
                  </span>
                  <span className="tracking-tight">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={`text-center text-[10px] font-bold text-gray-400 dark:text-gray-600 pb-2 transition-all duration-700 delay-700 ${mounted ? 'opacity-100' : 'opacity-0'} print:hidden`}>
            Created using Kicksheet
          </div>
        </div>
      </div>

      {/* Map Modal */}
      <FieldMapModal isOpen={showFieldMap} onClose={() => setShowFieldMap(false)} />
      
      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm print:hidden">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-gray-300 dark:border-gray-800 relative shadow-2xl">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4 pr-10 tracking-tight">Share Lineup</h2>
            
            {/* URL Input & Copy */}
            <div className="flex items-center gap-2 mb-6">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-xl px-4 py-3 outline-none font-medium truncate"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(currentUrl)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors shrink-0 active:scale-95"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* API Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `${game?.teams?.name} Lineup`,
                      text: 'Check out our lineup for the upcoming game!',
                      url: currentUrl
                    }).catch(() => {})
                  } else {
                    alert('Your browser does not support the native share menu.')
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95 border border-gray-200 dark:border-gray-700"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default function PublicGamePage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] flex items-center justify-center bg-[#f8f9fa] dark:bg-gray-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <PublicLineupContent />
    </Suspense>
  )
}