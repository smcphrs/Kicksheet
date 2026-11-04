'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Calendar, Clock, MapPin, Trash2, Plus, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

export default function GamesPage() {
  const supabase = createClient()
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [gameToDelete, setGameToDelete] = useState<any>(null) 
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchGames() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('games')
        .select('*, teams(name)')
        .eq('user_id', user.id)
        .order('game_date', { ascending: false })

      if (data) setGames(data)
      setLoading(false)
    }
    fetchGames()
  }, [supabase])

  const handleDelete = async () => {
    if (!gameToDelete) return
    setDeletingId(gameToDelete.id)

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', gameToDelete.id)

    if (!error) {
      setGames(games.filter(g => g.id !== gameToDelete.id))
      setGameToDelete(null)
    } else {
      console.error(error)
      alert('Failed to delete game.')
    }
    setDeletingId(null)
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD'
    const [hourString, minute] = timeString.split(':')
    const hour = parseInt(hourString, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minute} ${ampm}`
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center transition-colors">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-24 sm:px-6 sm:pt-24 w-full space-y-8 sm:space-y-10">
        
        <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>

        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              Games
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium text-lg tracking-tight">Manage your schedule and lineups.</p>
          </div>
          
          <div className="flex w-full sm:w-auto">
            <Link 
              href="/games/new"
              className="flex-1 sm:flex-none text-center bg-[#2563eb] text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold transition-colors active:scale-95 inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Game
            </Link>
          </div>
        </header>

        <div className="space-y-3 sm:space-y-4">
          {/* Structural Header Bar */}
          <div className="w-full bg-gray-300/60 dark:bg-black/40 border border-blue-400/40 dark:border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between mb-4">
            <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
              Active Schedule
            </h2>
          </div>

          {games.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 p-10 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl transition-colors">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No games yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto font-medium">Create your first game to start building your lineup.</p>
              <Link 
                href="/games/new"
                className="inline-flex bg-[#0a192f] dark:bg-blue-200 text-white dark:text-[#0a192f] border border-gray-300 dark:border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-blue-300 transition-colors active:scale-95"
              >
                Create First Game
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {games.map(game => {
                const formattedDate = game.game_date 
                  ? new Date(game.game_date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
                  : 'Unknown Date'

                return (
                  <div key={game.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-300 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    
                    <Link href={`/games/${game.id}`} className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black px-2 py-1 bg-gray-100 dark:bg-gray-800 border border-transparent text-gray-500 dark:text-gray-400 rounded-md uppercase tracking-widest group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {game.teams?.name || 'Team'}
                        </span>
                        <span className="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-widest">vs</span>
                        <span className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">{game.opposing_team || 'TBD'}</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm font-bold text-gray-500 dark:text-gray-400 tracking-tight">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          {formattedDate}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          {formatTime(game.game_time)}
                        </div>
                        {(game.location || game.field) && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            {game.location} {game.field ? `• ${game.field}` : ''}
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-gray-200 dark:border-gray-800">
                      <Link 
                        href={`/games/${game.id}`}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors border border-gray-300 dark:border-gray-700 active:scale-95"
                      >
                        Lineup
                      </Link>
                      <button 
                        onClick={() => setGameToDelete(game)}
                        className="inline-flex items-center justify-center p-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors border border-red-200 dark:border-red-900/50 active:scale-95"
                        title="Delete Game"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {gameToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-gray-300 dark:border-gray-700">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-5 border border-red-200 dark:border-red-900/50">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Delete Game?</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
                Are you sure you want to delete the game against <strong className="text-gray-700 dark:text-gray-300">{gameToDelete.opposing_team || 'TBD'}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setGameToDelete(null)}
                  disabled={deletingId !== null}
                  className="flex-1 py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors border border-gray-300 dark:border-gray-700 disabled:opacity-50 active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={deletingId !== null}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 active:scale-95"
                >
                  {deletingId === gameToDelete.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}