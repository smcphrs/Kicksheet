import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Users, User, Calendar, Plus, ChevronRight, MapPin, Clock, Shield, Activity, Settings, Trophy, ArrowRight, Zap } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch Teams first
  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  const teamIds = teams?.map(t => t.id) || []

  // 3. Fetch Accurate Player Count
  let playersCount = 0
  if (teamIds.length > 0) {
    const { count } = await supabase
      .from('players')
      .select('id', { count: 'exact', head: true })
      .in('team_id', teamIds)
    playersCount = count || 0
  }

  // 4. Fetch All Games for stats and sorting
  const today = new Date().toISOString().split('T')[0]
  const { data: allGames } = await supabase
    .from('games')
    .select('*, teams(name)')
    .eq('user_id', user.id)
    .order('game_date', { ascending: true })

  const upcomingGames = allGames?.filter(g => g.game_date >= today) || []
  const pastGames = allGames?.filter(g => g.game_date < today).reverse() || [] 
  
  const nextGame = upcomingGames.length > 0 ? upcomingGames[0] : null
  const recentGames = pastGames.slice(0, 4)

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
        
        {/* Mobile-Only Logo Header (Directly on background) */}
        <div className="sm:hidden flex flex-col gap-1 pb-2">
          <img 
            src="/assets/kicksheet-logo.png" 
            alt="Kicksheet" 
            className="h-18 w-auto object-contain dark:hidden" 
          />
          <img 
            src="/assets/kicksheet-logo-white.png" 
            alt="Kicksheet" 
            className="h-18 w-auto object-contain hidden dark:block" 
          />
          <p className="text-gray-500 dark:text-gray-400 font-regular text-sm tracking-tight mt-1">
            <center>Kickball Line-Up Creator</center>
          </p>
        </div>

        {/* Header & Main Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium text-lg tracking-tight"></p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <Link 
              href="/teams/new"
              className="flex-1 sm:flex-none text-center bg-[#0a192f] dark:bg-blue-200 text-white dark:text-[#0a192f] border border-gray-300 dark:border-gray-700 px-5 py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-blue-300 font-bold transition-colors active:scale-95 inline-flex items-center justify-center gap-2 group"
            >
              <Shield className="w-4 h-4 text-white dark:text-[#0a192f] transition-colors" />
              New Team
            </Link>
            <Link 
              href="/games/new"
              className="flex-1 sm:flex-none text-center bg-[#2563eb] text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold transition-colors active:scale-95 inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Game
            </Link>
          </div>
        </div>

        {/* STATS SECTION */}
        <div className="space-y-3 sm:space-y-4">
          {/* Stats Header Bar */}
          <div className="w-full bg-gray-200/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 flex items-center">
            <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Stats</h2>
          </div>

          {/* Heavy Stat Grid - Static Solid Borders */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            <div className="group bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-300 dark:border-gray-700 flex flex-col justify-between transition-colors cursor-default">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-all duration-300">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total Teams</h3>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{teams?.length || 0}</p>
            </div>

            <div className="group bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-300 dark:border-gray-700 flex flex-col justify-between transition-colors cursor-default">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-all duration-300">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Players</h3>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{playersCount}</p>
            </div>

            <div className="group bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-300 dark:border-gray-700 flex flex-col justify-between transition-colors cursor-default">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50 transition-all duration-300">
                  <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Upcoming</h3>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{upcomingGames.length}</p>
            </div>

            <div className="group bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-300 dark:border-gray-700 flex flex-col justify-between transition-colors cursor-default">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-all duration-300">
                  <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Games Played</h3>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{pastGames.length}</p>
            </div>
          </div>
        </div>

        {/* Quick Hub Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/teams" className="group flex items-center justify-center gap-2.5 p-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
            <Shield className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" /> View Roster
          </Link>
          <Link href="/games" className="group flex items-center justify-center gap-2.5 p-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
            <Calendar className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" /> Schedule
          </Link>
          <Link href="/players" className="group flex items-center justify-center gap-2.5 p-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
            <Users className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" /> Player DB
          </Link>
          <Link href="/settings" className="group flex items-center justify-center gap-2.5 p-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
            <Settings className="w-4 h-4 text-gray-500 group-hover:rotate-90 transition-transform duration-500" /> Settings
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Next Game & Teams Hub */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Next Game Hero */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                  Next Up
                </h2>
              </div>
              
              {nextGame ? (
                <div className="group bg-white dark:bg-gray-900 rounded-3xl border border-gray-300 dark:border-gray-700 overflow-hidden flex flex-col sm:flex-row transition-colors">
                  <div className="bg-[#2563eb] p-6 sm:p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
                      <Calendar className="w-40 h-40 text-white" />
                    </div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full mb-4 border border-white/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Scheduled
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-black text-white mb-1.5 leading-none tracking-tight">{nextGame.teams?.name}</h3>
                      <p className="text-blue-100 font-semibold text-lg sm:text-xl tracking-tight mb-0">vs {nextGame.opposing_team || 'TBD'}</p>
                    </div>
                  </div>
                  
                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between bg-white dark:bg-gray-900 relative border-t sm:border-t-0 sm:border-l border-gray-300 dark:border-gray-700">
                    <div className="space-y-4 mb-6 relative z-10">
                      <div className="flex items-center text-gray-700 dark:text-gray-200 font-bold">
                        <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                        {new Date(nextGame.game_date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="flex items-center text-gray-700 dark:text-gray-200 font-bold">
                        <Clock className="w-5 h-5 mr-3 text-orange-500" />
                        <span>{formatTime(nextGame?.game_time)}</span>
                      </div>
                      {nextGame.field && (
                        <div className="flex items-center text-gray-700 dark:text-gray-200 font-bold">
                          <MapPin className="w-5 h-5 mr-3 text-green-500" />
                          {nextGame.location ? `${nextGame.location} (${nextGame.field})` : nextGame.field}
                        </div>
                      )}
                    </div>
                    
                    <Link 
                      href={`/games/${nextGame.id}`} 
                      className="w-full text-center bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 px-5 py-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-extrabold tracking-wide transition-colors active:scale-95 inline-flex items-center justify-center gap-2 group/btn"
                    >
                      Manage Lineup <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center flex flex-col items-center justify-center min-h-[200px] transition-colors">
                  <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-bold tracking-tight mb-4">No upcoming games scheduled.</p>
                  <Link href="/games/new" className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline">
                    Schedule one now
                  </Link>
                </div>
              )}
            </section>

            {/* Teams Thumbnails Hub */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-xl font-extrabold text-gray-900 dark: