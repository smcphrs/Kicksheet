'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Zap, ArrowRight, X } from 'lucide-react'

export function ActiveGameBanner() {
  const [activeGame, setActiveGame] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchTodayGames() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get current date in local YYYY-MM-DD format safely
      const now = new Date()
      const offset = now.getTimezoneOffset()
      const localNow = new Date(now.getTime() - (offset * 60 * 1000))
      const todayStr = localNow.toISOString().split('T')[0]

      const { data: games } = await supabase
        .from('games')
        .select('*, teams(name)')
        .eq('user_id', user.id)
        .eq('game_date', todayStr)

      if (games && games.length > 0) {
        let foundActiveGame = null
        
        for (const game of games) {
          if (!game.game_time) continue
          
          // Parse the game time as UTC since timezone handling is native in the browser
          const gameStart = new Date(`${game.game_date}T${game.game_time}:00Z`)
          
          // Define the "Active" Window: 30 mins before start -> 60 mins after start
          const startTimeMs = gameStart.getTime() - (30 * 60 * 1000) 
          const endTimeMs = gameStart.getTime() + (60 * 60 * 1000) // Updated to 60 minutes
          const currentMs = now.getTime()

          if (currentMs >= startTimeMs && currentMs <= endTimeMs) {
            foundActiveGame = game
            break
          }
        }
        setActiveGame(foundActiveGame)
      }
    }

    fetchTodayGames()
    
    // Check every 60 seconds to automatically show/hide the banner
    const interval = setInterval(fetchTodayGames, 60000)
    return () => clearInterval(interval)
  }, [])

  // Don't render anything if there's no active game or the user dismissed it
  if (!activeGame || dismissed) return null

  return (
    <div className="sticky top-0 z-[9999] w-full bg-[#43a047] dark:bg-green-600 text-white px-4 py-3 shadow-xl animate-in slide-in-from-top-full duration-500 flex items-center justify-center">
      <div className="flex items-center gap-3 w-full max-w-6xl">
        
        {/* Pulsing Icon */}
        <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/20 shrink-0 animate-pulse">
          <Zap className="w-4 h-4 text-white" />
        </div>
        
        {/* Game Info */}
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-4 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="font-extrabold text-sm sm:text-base tracking-tight truncate">
              GAME LIVE: {activeGame.teams?.name}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-medium text-green-100 truncate">
             vs {activeGame.opposing_team || 'TBD'}
             {activeGame.location ? ` @ ${activeGame.location} ${activeGame.field ? `(${activeGame.field})` : ''}` : activeGame.field ? ` @ ${activeGame.field}` : ''}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 pl-2 border-l border-white/20 sm:border-none">
          <Link 
            href={`/games/${activeGame.id}`}
            className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-green-700 hover:bg-green-50 font-bold rounded-lg transition-colors active:scale-95 text-xs sm:text-sm shadow-sm"
          >
            Lineup <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
          </Link>
          <button 
            onClick={() => setDismissed(true)}
            className="p-1.5 hover:bg-white/20 rounded-md transition-colors active:scale-95 text-white/80 hover:text-white"
            title="Dismiss"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        
      </div>
    </div>
  )
}