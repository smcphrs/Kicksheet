'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Calendar, Trash2, ArrowLeft, Loader2, AlertCircle, ArchiveRestore, Archive } from 'lucide-react'

export default function ArchivedGamesPage() {
  const supabase = createClient()
  
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [gameToDelete, setGameToDelete] = useState<any>(null) 
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchArchivedGames() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('games')
        .select('*, teams(name)')
        .eq('user_id', user.id)
        .eq('is_archived', true)
        .order('game_date', { ascending: false })

      if (data) setGames(data)
      setLoading(false)
    }
    fetchArchivedGames()
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

  const handleRestore = async (game: any) => {
    setRestoringId(game.id)

    const { error } = await supabase
      .from('games')
      .update({ is_archived: false })
      .eq('id', game.id)

    if (!error) {
      setGames(games.filter(g => g.id !== game.id))
    } else {
      console.error(error)
      alert('Failed to restore game.')
    }
    setRestoringId(null)
  }

  const getResultColor = (result: string | null) => {
    if (result === 'W') return 'text-emerald-600 dark:text-emerald-400'
    if (result === 'L') return 'text-rose-600 dark:text-rose-400'
    if (result === 'T') return 'text-slate-600 dark:text-slate-400'
    return 'text-gray-500'
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center transition-colors">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 mt-4 pt-10 pb-24 sm:px-6 sm:pt-24 w-full space-y-8 sm:space-y-10">
        
        <Link href="/games" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Active Games
        </Link>

        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <Archive className="w-4 h-4" /> Archived Games
          </h1>
        </header>

        <div className="space-y-3 sm:space-y-4">
          {games.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 p-10 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl transition-colors">
              <Archive className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Vault is empty</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto font-medium">
                When you archive a game from your schedule, it will be securely stored here.
              </p>
              <Link 
                href="/games"
                className="inline-flex bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95"
              >
                Back to Schedule
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {games.map(game => {
                const d = new Date(game.game_date)
                const dateStr = game.game_date 
                  ? d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' }) 
                  : 'Date TBD'

                return (
                  <div key={game.id} className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 group opacity-80 hover:opacity-100 transition-opacity">
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] sm:text-xs font-black px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md uppercase tracking-widest">
                          {game.teams?.name || 'Team'}
                        </span>
                        {game.result && (
                          <span className={`text-[10px] font-black uppercase tracking-widest ${getResultColor(game.result)}`}>
                            {game.result === 'W' ? 'Win' : game.result === 'L' ? 'Loss' : 'Tie'}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1.5 flex items-center flex-wrap gap-2">
                        <span className="text-gray-400 text-base">vs</span> {game.opposing_team || 'TBD'}
                      </h3>
                      
                      <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                        {dateStr}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800">
                      <button 
                        onClick={() => handleRestore(game)}
                        disabled={restoringId === game.id}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold rounded-xl transition-colors border border-blue-200 dark:border-blue-900/50 active:scale-95 text-sm disabled:opacity-50"
                      >
                        {restoringId === game.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <><ArchiveRestore className="w-4 h-4 mr-2" /> Restore</>
                        )}
                      </button>
                      
                      <button 
                        onClick={() => setGameToDelete(game)}
                        className="inline-flex items-center justify-center p-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors border border-red-200 dark:border-red-900/50 active:scale-95"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {gameToDelete && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-gray-300 dark:border-gray-700">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-5 border border-red-200 dark:border-red-900/50">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Delete Permanently?</h2>
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
                Are you sure you want to permanently delete this archived game against <strong className="text-gray-700 dark:text-gray-300">{gameToDelete.opposing_team || 'TBD'}</strong>?
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
                  {deletingId === gameToDelete.id ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}