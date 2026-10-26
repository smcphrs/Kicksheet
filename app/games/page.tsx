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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-gray-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 w-full pb-24 bg-[#f8f9fa] dark:bg-gray-950 min-h-screen font-sans transition-colors">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Games</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Manage your schedule and lineups</p>
        </div>
        <Link 
          href="/games/new"
          className="inline-flex items-center justify-center px-5 py-3 bg-[#2563eb] hover:bg-blue-700 text-white font-bold rounded-xl transition-colors w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Game
        </Link>
      </header>

      {games.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl transition-colors">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No games yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Create your first game to start building your lineup.</p>
          <Link 
            href="/games/new"
            className="inline-flex bg-white dark:bg-gray-800 text-[#2563eb] dark:text-blue-400 border border-gray-200 dark:border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Create First Game
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {games.map(game => {
            const formattedDate = game.game_date 
              ? new Date(game.game_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
              : 'Unknown Date'

            return (
              <div key={game.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                
                <Link href={`/games/${game.id}`} className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-md uppercase tracking-wider">
                      {game.teams?.name || 'Team'}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 font-bold text-sm">vs</span>
                    <span className="text-lg font-extrabold text-gray-900 dark:text-white">{game.opposing_team || 'TBD'}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
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

                <div className="flex items-center gap-2 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-gray-100 dark:border-gray-800">
                  <Link 
                    href={`/games/${game.id}`}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
                  >
                    Lineup
                  </Link>
                  <button 
                    onClick={() => setGameToDelete(game)}
                    className="inline-flex items-center justify-center p-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-colors border border-red-100 dark:border-red-500/20"
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

      {gameToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-gray-100 dark:border-gray-800">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-5">
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
                className="flex-1 py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors border border-gray-200 dark:border-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
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
  )
}