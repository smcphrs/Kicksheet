'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, Trash2, Plus, ArrowLeft, Loader2, AlertCircle, Filter, ArrowDownAZ, Copy, Trophy } from 'lucide-react'

export default function GamesPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtering & Sorting State
  const [filterTeam, setFilterTeam] = useState('All')
  const [filterResult, setFilterResult] = useState('All') // <-- NEW STATE
  const [sortOrder, setSortOrder] = useState('recent') 
  
  const [gameToDelete, setGameToDelete] = useState<any>(null) 
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [updatingResultId, setUpdatingResultId] = useState<string | null>(null)

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

  const handleDuplicate = async (game: any) => {
    setDuplicatingId(game.id)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setDuplicatingId(null)
      return
    }

    const { data, error } = await supabase
      .from('games')
      .insert([{
        user_id: user.id,
        team_id: game.team_id || null,
        attendance: game.attendance || null,
        kicking_order: game.kicking_order || null,
        innings: game.innings || null,
        subs: game.subs || null,
        game_date: game.game_date || null, 
        game_time: game.game_time || null,
        opposing_team: `${game.opposing_team || 'TBD'} (Copy)`,
        location: game.location || null,
        field: game.field || null
      }])
      .select()
      .single()

    if (!error && data) {
      router.push(`/games/${data.id}/edit`)
    } else {
      console.error('Supabase Error Details:', error)
      alert(`Failed to duplicate: ${error?.message || 'Unknown Database Error'}`)
      setDuplicatingId(null)
    }
  }

  const handleUpdateResult = async (gameId: string, result: 'W' | 'L' | 'T' | null) => {
    setUpdatingResultId(gameId)
    const { error } = await supabase
      .from('games')
      .update({ result })
      .eq('id', gameId)

    if (!error) {
      setGames(games.map(g => g.id === gameId ? { ...g, result } : g))
    } else {
      alert('Failed to save result.')
    }
    setUpdatingResultId(null)
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD'
    const [hourString, minute] = timeString.split(':')
    const hour = parseInt(hourString, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minute} ${ampm}`
  }

  const getResultColors = (result: string | null) => {
    switch (result) {
      case 'W': return 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 shadow-emerald-500/20'
      case 'L': return 'bg-rose-500 hover:bg-rose-600 border-rose-600 shadow-rose-500/20'
      case 'T': return 'bg-slate-500 hover:bg-slate-600 border-slate-600 shadow-slate-500/20'
      default: return 'bg-[#2563eb] hover:bg-blue-700 border-blue-700 shadow-blue-500/20' // Default Blue
    }
  }

  const uniqueTeams = Array.from(new Set(games.map(g => g.teams?.name).filter(Boolean))) as string[]

  const filteredAndSortedGames = [...games]
    .filter(g => filterTeam === 'All' ? true : g.teams?.name === filterTeam)
    .filter(g => {
      if (filterResult === 'All') return true
      if (filterResult === 'W') return g.result === 'W'
      if (filterResult === 'L') return g.result === 'L'
      if (filterResult === 'T') return g.result === 'T'
      if (filterResult === 'Pending') return !g.result
      return true
    })
    .sort((a, b) => {
      if (sortOrder === 'recent') {
        const dateA = new Date(a.game_date || 0).getTime()
        const dateB = new Date(b.game_date || 0).getTime()
        return dateB - dateA
      } else if (sortOrder === 'alpha') {
        const teamA = (a.opposing_team || 'TBD').toLowerCase()
        const teamB = (b.opposing_team || 'TBD').toLowerCase()
        return teamA.localeCompare(teamB)
      }
      return 0
    })

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
          
          <div className="w-full bg-gray-300/60 dark:bg-black/40 border border-blue-400/40 dark:border-blue-500/20 rounded-xl px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest hidden md:block">
              Active Schedule
            </h2>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto">
              
              {/* Team Filter */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 flex-1 sm:flex-none">
                <Filter className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none w-full cursor-pointer appearance-none"
                >
                  <option value="All">All Teams</option>
                  {uniqueTeams.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              {/* Result Filter */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 flex-1 sm:flex-none">
                <Trophy className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                <select
                  value={filterResult}
                  onChange={(e) => setFilterResult(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none w-full cursor-pointer appearance-none"
                >
                  <option value="All">All Results</option>
                  <option value="W">Wins Only</option>
                  <option value="L">Losses Only</option>
                  <option value="T">Ties Only</option>
                  <option value="Pending">Unmarked</option>
                </select>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 flex-1 sm:flex-none">
                {sortOrder === 'recent' ? (
                  <Clock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                ) : (
                  <ArrowDownAZ className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
                )}
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-200 outline-none w-full cursor-pointer appearance-none"
                >
                  <option value="recent">Most Recent</option>
                  <option value="alpha">Opponent (A-Z)</option>
                </select>
              </div>

            </div>
          </div>

          {filteredAndSortedGames.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 p-10 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl transition-colors">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No games found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto font-medium">
                {games.length === 0 ? "Create your first game to start building your lineup." : "Try adjusting your filters."}
              </p>
              {games.length === 0 ? (
                <Link 
                  href="/games/new"
                  className="inline-flex bg-[#0a192f] dark:bg-blue-200 text-white dark:text-[#0a192f] border border-gray-300 dark:border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-blue-300 transition-colors active:scale-95"
                >
                  Create First Game
                </Link>
              ) : (
                <button 
                  onClick={() => { setFilterTeam('All'); setSortOrder('recent'); setFilterResult('All'); }}
                  className="inline-flex bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6">
              {filteredAndSortedGames.map(game => {
                const d = new Date(game.game_date)
                const month = game.game_date ? d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' }) : 'TBD'
                const day = game.game_date ? d.toLocaleDateString('en-US', { timeZone: 'UTC', day: 'numeric' }) : '-'
                const isPast = game.game_date && (new Date(`${game.game_date}T23:59:59Z`).getTime() < Date.now())
                const isUpdating = updatingResultId === game.id

                return (
                  <div key={game.id} className="relative bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg dark:hover:shadow-none transition-all flex flex-col sm:flex-row overflow-hidden group">
                    
                    {/* Ticket Stub Date Block */}
                    <div className={`w-full sm:w-32 p-4 sm:p-0 flex flex-row sm:flex-col items-center justify-between sm:justify-center shrink-0 border-b sm:border-b-0 sm:border-r border-black/10 dark:border-white/10 transition-colors duration-300 ${getResultColors(game.result)} text-white relative`}>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                      
                      <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-0 relative z-10">
                        <span className="text-xs sm:text-sm font-black uppercase tracking-widest opacity-90">{month}</span>
                        <span className="text-2xl sm:text-4xl font-black leading-none tracking-tighter">{day}</span>
                      </div>
                      
                      {/* Mobile-only compact result indicator */}
                      <div className="sm:hidden font-black text-xl opacity-90">
                        {game.result === 'W' && 'WIN'}
                        {game.result === 'L' && 'LOSS'}
                        {game.result === 'T' && 'TIE'}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between bg-white dark:bg-gray-900">
                      
                      {/* Top: Info & Results */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div className="flex-1">
                          <span className="text-[10px] sm:text-xs font-black px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md uppercase tracking-widest mb-2 inline-block">
                            {game.teams?.name || 'Team'}
                          </span>
                          <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-1.5 flex items-center flex-wrap gap-2">
                            <span className="text-gray-400 text-base sm:text-lg">vs</span> {game.opposing_team || 'TBD'}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 tracking-tight">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 opacity-70" />
                              {formatTime(game.game_time)}
                            </div>
                            {(game.location || game.field) && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 opacity-70" />
                                {game.location} {game.field ? `• ${game.field}` : ''}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Result Toggles (Desktop only inline, Mobile below info) */}
                        {isPast && (
                          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-xl border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
                            {isUpdating ? (
                              <div className="w-[120px] h-[34px] flex items-center justify-center">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              </div>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleUpdateResult(game.id, game.result === 'W' ? null : 'W')}
                                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-black transition-all ${game.result === 'W' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                >W</button>
                                <button 
                                  onClick={() => handleUpdateResult(game.id, game.result === 'L' ? null : 'L')}
                                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-black transition-all ${game.result === 'L' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                >L</button>
                                <button 
                                  onClick={() => handleUpdateResult(game.id, game.result === 'T' ? null : 'T')}
                                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-black transition-all ${game.result === 'T' ? 'bg-slate-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                >T</button>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Link 
                          href={`/games/${game.id}`}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors border border-gray-200 dark:border-gray-700 active:scale-95 text-sm"
                        >
                         View Lineup
                        </Link>
                        
                        <button 
                          onClick={() => handleDuplicate(game)}
                          disabled={duplicatingId === game.id}
                          className="inline-flex items-center justify-center p-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl transition-colors border border-blue-200 dark:border-blue-900/50 active:scale-95 disabled:opacity-50"
                          title="Duplicate Game & Lineup"
                        >
                          {duplicatingId === game.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Copy className="w-5 h-5" />}
                        </button>

                        <button 
                          onClick={() => setGameToDelete(game)}
                          className="inline-flex items-center justify-center p-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors border border-red-200 dark:border-red-900/50 active:scale-95"
                          title="Delete Game"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
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