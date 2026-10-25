'use client'

import { useEffect, useState, useRef, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Calendar, Clock, MapPin, Users, Cloud, ArrowLeft, Download, Loader2, Edit } from 'lucide-react'
import { toBlob } from 'html-to-image'

export default function GameLineupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  
  const [game, setGame] = useState<any>(null)
  const [orderedPlayers, setOrderedPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  
  const captureRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
      const blob = await toBlob(captureRef.current, { 
        quality: 1,
        backgroundColor: '#f8f9fa',
        pixelRatio: 2 
      })
      
      if (!blob) throw new Error("Failed to generate blob")

      const safeTeamName = game?.teams?.name ? game.teams.name.replace(/\s+/g, '_') : 'Team'
      const fileName = `${safeTeamName}_Lineup.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${safeTeamName} Lineup`,
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
      case 'LF': return 'bg-[#00acc1] text-white' 
      case 'RC': return 'bg-[#3949ab] text-white' 
      case 'P': return 'bg-[#f44336] text-white' 
      case '1B': return 'bg-[#f4511e] text-white' 
      case '2B': return 'bg-[#fb8c00] text-white' 
      case '3B': return 'bg-[#fdd835] text-gray-900' 
      case 'Bench':
      case 'OUT': return 'bg-[#757575] text-white' 
      default: return 'bg-gray-400 text-white'
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  const numInnings = game.innings && game.innings.length > 0 ? game.innings.length : 7
  const INNINGS = Array.from({ length: numInnings }, (_, i) => i + 1)
  
  const formattedDate = game.game_date 
    ? new Date(game.game_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Unknown Date'

  return (
    <div className="bg-[#f8f9fa] min-h-[100dvh] font-sans pb-10">
      
      {/* Action Bar */}
      <div className="max-w-4xl mx-auto w-full flex justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex gap-4">
          <Link href="/games" className="inline-flex items-center text-xs font-bold text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Link>
          <Link href={`/games/${game.id}/edit`} className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800">
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </Link>
        </div>
        
        <button 
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Download className="w-4 h-4 mr-1.5" />}
          Save Image
        </button>
      </div>

      {/* Wrapper for the Screenshot area */}
      <div className="max-w-4xl mx-auto w-full" ref={captureRef}>
        
        <div className="px-2 sm:px-6 pt-2 sm:pt-6">
          {/* Solid Blue Header - Shadows Removed */}
          <div className="bg-[#2563eb] text-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl mb-4 sm:mb-8">
            <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight mb-2 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
              <span className="text-blue-200 text-lg sm:text-2xl">vs</span> {game.opposing_team || 'TBD'}
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

          {/* Tightly packed Master Lineup */}
          <h2 className="text-lg sm:text-2xl font-extrabold text-gray-900 mb-2 sm:mb-4 pl-1">Lineup</h2>

          {/* Table Wrapper */}
          <div className="bg-white rounded-xl sm:rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#2563eb] text-white text-[11px] sm:text-sm font-bold">
                <tr>
                  <th className="px-2 sm:px-4 py-2 sm:py-4 w-[80px] sm:w-[140px]">
                    Order
                  </th>
                  {INNINGS.map(i => (
                        <th key={i} className="px-0.5 sm:px-2 py-2 sm:py-4 text-center min-w-[28px] sm:min-w-[50px]">
                      {i}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[11px] sm:text-sm font-bold text-gray-800">
                {orderedPlayers.map((player: any, idx: number) => {
                  const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#f1f5f9]'
                  
                  return (
                    <tr key={player.id} className={rowBg}>
                      <td className