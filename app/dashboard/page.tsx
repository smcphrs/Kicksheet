import { createClient } from '@/lib/supabase/server'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import { Users, Calendar, Plus, MapPin, Clock, Shield, Settings, Trophy, ArrowRight, Zap, Archive } from 'lucide-react'
import { redirect } from 'next/navigation'
import { FieldMapShortcut } from '@/components/FieldMapShortcut'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }
  // --- AUTO-CAPTURE LOCATION ---
  const headerStore = await headers()
  const city = headerStore.get('x-vercel-ip-city')
  const region = headerStore.get('x-vercel-ip-country-region')
  
  if (city && region) {
    // Fire and forget: Update location if we have it
    const locationString = `${decodeURIComponent(city)}, ${region}`
    await supabase
      .from('profiles')
      .update({ location: locationString })
      .eq('id', user.id)
  }
  // -----------------------------

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  // Separate Active vs Archived teams
  const activeTeams = teams?.filter(t => !t.is_archived) || []
  const archivedTeams = teams?.filter(t => t.is_archived) || []
  const teamIds = activeTeams.map(t => t.id)

  let playersCount = 0
  if (teamIds.length > 0) {
    const { count } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .in('team_id', teamIds)
    playersCount = count || 0
  }

  const { data: allGames } = await supabase
    .from('games')
    .select('*, teams(name)')
    .eq('user_id', user.id)
    .order('game_date', { ascending: true })

  const currentUtcMs = Date.now()
  const ONE_HOUR_MS = 60 * 60 * 1000

  const sortedGames = (allGames || []).map(g => {
    const gameDateStr = g.game_time ? `${g.game_date}T${g.game_time}:00Z` : `${g.game_date}T00:00:00Z`
    const gameStartMs = new Date(gameDateStr).getTime()
    return { ...g, gameStartMs }
  })

  const upcomingGames = sortedGames.filter(g => (g.gameStartMs + ONE_HOUR_MS) > currentUtcMs).sort((a, b) => a.gameStartMs - b.gameStartMs)
  const pastGames = sortedGames.filter(g => (g.gameStartMs + ONE_HOUR_MS) <= currentUtcMs).sort((a, b) => b.gameStartMs - a.gameStartMs)
  
  const nextGame = upcomingGames.length > 0 ? upcomingGames[0] : null
  const recentGames = pastGames.slice(0, 4)

  // --- Smart Active Window Logic ---
  const isNextGameActive = nextGame 
    ? (currentUtcMs >= nextGame.gameStartMs - ONE_HOUR_MS && currentUtcMs <= nextGame.gameStartMs + ONE_HOUR_MS)
    : false;

  const totalWins = allGames?.filter(g => g.result === 'W').length || 0
  const totalLosses = allGames?.filter(g => g.result === 'L').length || 0
  const totalTies = allGames?.filter(g => g.result === 'T').length || 0

  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD'
    const [hourString, minute] = timeString.split(':')
    const hour = parseInt(hourString, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minute} ${ampm}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 transition-colors">
      <div className="max-w-6xl mx-auto px-4 pt-12 pb-24 sm:px-6 sm:pt-28 w-full space-y-8 sm:space-y-10">
        
        <div className="sm:hidden flex flex-col gap-1 pb-2">
          <img src="/assets/kicksheet-logo.png" alt="Kicksheet" className="h-12 w-auto object-contain dark:hidden" />
          <img src="/assets/kicksheet-logo-white.png" alt="Kicksheet" className="h-12 w-auto object-contain hidden dark:block" />
          <p className="text-gray-500 dark:text-gray-400 font-regular text-sm tracking-tight mt-1">
            <center>Create winning kickball lineups in minutes.</center>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium text-lg tracking-tight"></p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Link href="/teams/new" className="flex-1 sm:flex-none text-center bg-[#0a192f] dark:bg-blue-200 text-white dark:text-[#0a192f] border border-gray-300 dark:border-gray-700 px-5 py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-blue-300 font-bold transition-colors active:scale-95 inline-flex items-center justify-center gap-2 group">
              <Shield className="w-4 h-4 text-white dark:text-[#0a192f] transition-colors" />
              New Team
            </Link>
            <Link href="/games/new" className="flex-1 sm:flex-none text-center bg-[#2563eb] text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold transition-colors active:scale-95 inline-flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" />
              New Game
            </Link>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="w-full bg-gray-300/60 dark:bg-black/40 border border-blue-400/40 dark:border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center">
            <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Stats</h2>
          </div>

          {/* Compact Horizontal Stat Cards - Added 'items-start' to prevent CSS Grid from stretching them */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 items-start">
            
            {/* Active Teams */}
            <div className="group relative bg-[#1e40af] px-4 py-3 rounded-xl border border-[#1e40af] flex items-center justify-between transition-all cursor-default overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white opacity-10 rounded-full blur-xl pointer-events-none transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col">
                <h3 className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mb-0.5">Active Teams</h3>
                <p className="text-2xl font-black text-white tracking-tight leading-none">{activeTeams.length}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/20 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm relative z-10">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Players */}
            <div className="group relative bg-[#43a047] px-4 py-3 rounded-xl border border-[#43a047] flex items-center justify-between transition-all cursor-default overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white opacity-10 rounded-full blur-xl pointer-events-none transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col">
                <h3 className="text-[10px] font-bold text-green-100 uppercase tracking-widest mb-0.5">Players</h3>
                <p className="text-2xl font-black text-white tracking-tight leading-none">{playersCount}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/20 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm relative z-10">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Upcoming */}
            <div className="group relative bg-[#ff9800] px-4 py-3 rounded-xl border border-[#ff9800] flex items-center justify-between transition-all cursor-default overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white opacity-10 rounded-full blur-xl pointer-events-none transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col">
                <h3 className="text-[10px] font-bold text-orange-50 uppercase tracking-widest mb-0.5">Upcoming</h3>
                <p className="text-2xl font-black text-white tracking-tight leading-none">{upcomingGames.length}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/20 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm relative z-10">
                <Calendar className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Games Played */}
            <div className="group relative bg-[#c2185b] px-4 py-3 rounded-xl border border-[#c2185b] flex items-center justify-between transition-all cursor-default overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white opacity-10 rounded-full blur-xl pointer-events-none transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col">
                <h3 className="text-[10px] font-bold text-pink-100 uppercase tracking-widest mb-0.5">Games Played</h3>
                <p className="text-2xl font-black text-white tracking-tight leading-none">{pastGames.length}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/20 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm relative z-10">
                <Trophy className="w-4 h-4 text-white" />
              </div>
            </div>
            
            {/* Record Stat Card (Inline to match perfectly) */}
            <div className="group relative bg-[#1f2937] px-4 py-3 rounded-xl border border-[#1f2937] flex items-center justify-between transition-all cursor-default overflow-hidden shadow-sm col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-white opacity-10 rounded-full blur-xl pointer-events-none transition-transform duration-500"></div>
              <div className="relative z-10 flex flex-col">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Record</h3>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl font-black text-emerald-400 leading-none">{totalWins}<span className="text-[10px] font-bold text-emerald-500/80 ml-0.5">W</span></span>
                  <span className="text-gray-600 text-xs font-bold">-</span>
                  <span className="text-xl font-black text-rose-400 leading-none">{totalLosses}<span className="text-[10px] font-bold text-rose-500/80 ml-0.5">L</span></span>
                  <span className="text-gray-600 text-xs font-bold">-</span>
                  <span className="text-xl font-black text-slate-300 leading-none">{totalTies}<span className="text-[10px] font-bold text-slate-400/80 ml-0.5">T</span></span>
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center shrink-0 backdrop-blur-sm relative z-10">
                <Trophy className="w-4 h-4 text-gray-300" />
              </div>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link href="https://scheduler.leaguelobster.com/o/586394/big-apple-recreational-sports/" className="group flex items-center justify-center gap-2.5 p-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
            <Calendar className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" /> League Lobster
          </Link>
          <FieldMapShortcut />
          <Link href="/settings" className="group flex items-center justify-center gap-2.5 p-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
            <Settings className="w-4 h-4 text-gray-500 group-hover:rotate-90 transition-transform duration-500" /> Settings
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 space-y-8">
            
            <section>
              <div className="w-full bg-gray-300/60 dark:bg-black/40 border border-blue-400/40 dark:border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between mb-4">
                <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500" /> Next Up
                </h2>
              </div>
              
              {nextGame ? (
                <div className="group bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-gray-300 dark:border-gray-700 overflow-hidden flex flex-col sm:flex-row shadow-sm transition-all">
                  
                  <div className="w-full sm:w-48 p-6 flex flex-row sm:flex-col items-center justify-between sm:justify-center shrink-0 bg-[#ff9800] text-white relative border-b sm:border-b-0 sm:border-r border-black/10 dark:border-white/10 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>
                    <div className="absolute -bottom-6 -right-6 opacity-20 group-hover:scale-110 transition-transform duration-700 hidden sm:block">
                      <Zap className="w-32 h-32 text-white fill-white" />
                    </div>
                    <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-0 relative z-10">
                      <span className="text-sm font-black uppercase tracking-widest opacity-90">
                        {nextGame.game_date ? new Date(nextGame.game_date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' }) : 'TBD'}
                      </span>
                      <span className="text-3xl sm:text-5xl font-black leading-none tracking-tighter">
                        {nextGame.game_date ? new Date(nextGame.game_date).toLocaleDateString('en-US', { timeZone: 'UTC', day: 'numeric' }) : '-'}
                      </span>
                    </div>
                    <div className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1 bg-black/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/20 relative z-10">
                      {isNextGameActive && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                      {isNextGameActive ? 'ACTIVE' : 'UPCOMING'}
                    </div>
                  </div>
                  
                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between bg-white dark:bg-gray-900 relative">
                    <div className={`hidden sm:inline-flex absolute top-6 right-6 items-center gap-1.5 px-3 py-1 border text-[10px] font-bold uppercase tracking-widest rounded-full z-10 shadow-sm ${
                      isNextGameActive 
                        ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                    }`}>
                      {isNextGameActive && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                      {isNextGameActive ? 'ACTIVE' : 'SCHEDULED'}
                    </div>
                    
                    <div className="relative z-10 mb-6 sm:mb-8 pr-0 sm:pr-24">
                      <span className="text-xs font-black px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md uppercase tracking-widest mb-3 inline-block">
                        {nextGame.teams?.name}
                      </span>
                      <h3 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white mb-2 leading-none tracking-tight flex items-center flex-wrap gap-2">
                        <span className="text-gray-400 font-bold text-lg sm:text-2xl">vs</span> {nextGame.opposing_team || 'TBD'}
                      </h3>
                    </div>
                    
                    <div className="space-y-3 mb-6 sm:mb-8 text-sm sm:text-base font-bold text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 mr-3 text-blue-500 shrink-0" />
                        {new Date(nextGame.game_date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-5 h-5 mr-3 text-orange-500 shrink-0" />
                        <span>{formatTime(nextGame.game_time)}</span>
                      </div>
                      {nextGame.field && (
                        <div className="flex items-center">
                          <MapPin className="w-5 h-5 mr-3 text-green-500 shrink-0" />
                          {nextGame.location ? `${nextGame.location} (${nextGame.field})` : nextGame.field}
                        </div>
                      )}
                    </div>
                    
                    <Link 
                      href={`/games/${nextGame.id}`} 
                      className="w-full text-center bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 px-5 py-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-black tracking-wide transition-colors active:scale-95 inline-flex items-center justify-center gap-2 group/btn"
                    >
                      Manage Lineup <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center flex flex-col items-center justify-center min-h-[200px] transition-colors">
                  <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-bold tracking-tight mb-4">No upcoming games scheduled.</p>
                  <Link href="/games/new" className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline">Schedule one now</Link>
                </div>
              )}
            </section>

            <section>
              <div className="w-full bg-gray-300/60 dark:bg-black/40 border border-blue-400/40 dark:border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between mb-4">
                <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                  Your Teams
                </h2>
                {archivedTeams.length > 0 && (
                  <Link href="/teams/archived" className="text-xs font-bold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 transition-colors">
                    <Archive className="w-3.5 h-3.5" />
                    Archived ({archivedTeams.length})
                  </Link>
                )}
              </div>
              
              {activeTeams.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {activeTeams.map(team => (
                    <Link key={team.id} href={`/teams/${team.id}`} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 group text-center flex flex-col items-center transition-colors overflow-hidden shadow-sm">
                      <div className="w-full aspect-square bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border-b border-gray-200 dark:border-gray-800 overflow-hidden relative">
                        {team.logo_url ? (
                          <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <span className="text-4xl font-black text-[#2563eb] dark:text-blue-400 group-hover:scale-110 transition-transform duration-300 uppercase">
                            {team.name ? team.name.charAt(0) : '?'}
                          </span>
                        )}
                      </div>
                      
                      <div className="p-4 w-full flex flex-col items-center">
                        <h3 className="font-extrabold text-gray-900 dark:text-white tracking-tight truncate w-full px-1">{team.name}</h3>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-bold uppercase tracking-widest group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Manage Roster</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center transition-colors">
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-bold tracking-tight mb-3">You haven't created any active teams yet.</p>
                  <Link href="/teams/new" className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline text-sm">Create your first team</Link>
                </div>
              )}
            </section>
          </div>

          <div className="space-y-4 lg:pl-4">
            <div className="w-full bg-gray-300/60 dark:bg-black/40 border border-blue-400/40 dark:border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between mb-4">
              <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
                Recent Games
              </h2>
              <Link href="/games" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                View All
              </Link>
            </div>

            {recentGames && recentGames.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {recentGames.map((game: any) => {
                  const d = new Date(game.game_date);
                  const month = d.toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short' });
                  const day = d.toLocaleDateString('en-US', { timeZone: 'UTC', day: 'numeric' });
                  
                  let resultColor = "bg-[#2563eb]"
                  if (game.result === 'W') resultColor = "bg-emerald-500"
                  if (game.result === 'L') resultColor = "bg-rose-500"
                  if (game.result === 'T') resultColor = "bg-slate-500"
                  
                  return (
                    <Link 
                      key={game.id} 
                      href={`/games/${game.id}`}
                      className="flex bg-white dark:bg-gray-900 p-2.5 sm:p-3 rounded-2xl sm:rounded-3xl border border-gray-300 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md dark:hover:shadow-blue-900/20 active:scale-[0.98] group transition-all relative overflow-hidden"
                    >
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl ${resultColor} text-white flex flex-col items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-all duration-300 relative overflow-hidden`}>
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-90 z-10">{month}</span>
                        <span className="text-2xl sm:text-3xl font-black leading-none tracking-tighter z-10">{day}</span>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      
                      <div className="flex-1 pl-3 sm:pl-4 pr-10 sm:pr-16 py-0.5 sm:py-1 flex flex-col justify-start">
                        <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 tracking-tight truncate">{game.teams?.name}</span>
                        <h4 className="text-base sm:text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight truncate mt-0.5 sm:mt-1">vs {game.opposing_team || 'TBD'}</h4>
                      </div>

                      <div className="absolute bottom-2.5 sm:bottom-3 right-2.5 sm:right-3">
                        <div className="inline-flex items-center justify-center px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                          Lineup <ArrowRight className="w-3 h-3 ml-1 sm:ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center flex flex-col items-center justify-center min-h-[250px] transition-colors">
                <p className="text-gray-500 dark:text-gray-400 font-bold tracking-tight">No past games yet.</p>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  )
}