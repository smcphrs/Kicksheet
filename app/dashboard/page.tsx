import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Users, User, Calendar, Plus, ChevronRight, MapPin, Clock, Shield, Activity, Settings, Trophy, ArrowRight } from 'lucide-react'
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

  // 3. Fetch Accurate Player Count (Using teamIds instead of user_id)
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
  // Reverse to get the most recently played games first
  const pastGames = allGames?.filter(g => g.game_date < today).reverse() || [] 
  
  const nextGame = upcomingGames.length > 0 ? upcomingGames[0] : null
  const recentGames = pastGames.slice(0, 4) // Get top 4 recent games

  const formatTime = (timeString: string) => {
    if (!timeString) return 'TBD'
    const [hourString, minute] = timeString.split(':')
    const hour = parseInt(hourString, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minute} ${ampm}`
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-24 pb-24 sm:px-6 sm:pt-28 w-full space-y-8 sm:space-y-10 transition-colors">
      
      {/* Branded Logo Banner */}
      <div className="sm:hidden bg-gradient-to-r from-[#2563eb] to-blue-800 rounded-3xl p-6 flex flex-col items-start gap-3 shadow-sm">
  <img 
    src="/assets/kicksheet-logo-white.png" 
    alt="Kicksheet" 
    className="h-9 w-auto object-contain" 
  />
  <p className="text-blue-100 font-medium text-sm">
   Kickball Line-Up Creator.
  </p>
</div>

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Command Center</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium text-lg">Your teams, stats, and upcoming schedule.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <Link 
            href="/teams/new"
            className="flex-1 sm:flex-none text-center bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-bold transition-colors inline-flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            New Team
          </Link>
          <Link 
            href="/games/new"
            className="flex-1 sm:flex-none text-center bg-[#2563eb] text-white px-5 py-3 rounded-xl hover:bg-blue-700 font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            New Game
          </Link>
        </div>
      </div>

      {/* Heavy Stat Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Teams</h3>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">{teams?.length || 0}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Players</h3>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">{playersCount}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Upcoming</h3>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">{upcomingGames.length}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col justify-between transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Games Played</h3>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">{pastGames.length}</p>
        </div>
      </div>

      {/* Quick Hub Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/teams" className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
          <Shield className="w-4 h-4 text-blue-500" /> View Roster
        </Link>
        <Link href="/games" className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-orange-300 dark:hover:border-orange-700 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
          <Calendar className="w-4 h-4 text-orange-500" /> Full Schedule
        </Link>
        <Link href="/players" className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-green-300 dark:hover:border-green-700 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
          <Users className="w-4 h-4 text-green-500" /> Player DB
        </Link>
        <Link href="/settings" className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
          <Settings className="w-4 h-4 text-gray-500" /> Settings
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Next Game & Teams Hub */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Next Game Hero */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Next Up
              </h2>
            </div>
            
            {nextGame ? (
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm transition-colors flex flex-col sm:flex-row">
                <div className="bg-[#2563eb] p-6 sm:p-8 flex-1 flex flex-col justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Calendar className="w-32 h-32 text-white" />
                  </div>
                  <div className="relative z-10">
                    <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-md mb-3 border border-white/20">
                      Scheduled Game
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white mb-1 leading-tight">{nextGame.teams?.name}</h3>
                    <p className="text-blue-100 font-medium text-lg mb-0">vs {nextGame.opposing_team || 'TBD'}</p>
                  </div>
                </div>
                
                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between bg-white dark:bg-gray-900">
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center text-gray-600 dark:text-gray-300 font-medium">
                      <Calendar className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
                      {new Date(nextGame.game_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-300 font-medium">
                      <Clock className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
                      <span>{formatTime(nextGame?.game_time)}</span>
                    </div>
                    {nextGame.field && (
                      <div className="flex items-center text-gray-600 dark:text-gray-300 font-medium">
                        <MapPin className="w-5 h-5 mr-3 text-gray-400 dark:text-gray-500" />
                        {nextGame.location ? `${nextGame.location} (${nextGame.field})` : nextGame.field}
                      </div>
                    )}
                  </div>
                  
                  <Link 
                    href={`/games/${nextGame.id}`} 
                    className="w-full text-center bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 px-5 py-3.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 font-bold transition-colors inline-flex items-center justify-center gap-2"
                  >
                    Manage Lineup <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center flex flex-col items-center justify-center min-h-[200px]">
                <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">No upcoming games scheduled.</p>
                <Link href="/games/new" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                  Schedule one now
                </Link>
              </div>
            )}
          </section>

          {/* Teams Thumbnails Hub */}
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Your Teams</h2>
            </div>
            
            {teams && teams.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {teams.map(team => (
                  <Link key={team.id} href={`/teams/${team.id}`} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                      <Shield className="w-6 h-6 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                    <h3 className="font-extrabold text-gray-900 dark:text-white truncate w-full px-2">{team.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Manage Roster</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-3">You haven't created any teams yet.</p>
                <Link href="/teams/new" className="text-blue-600 dark:text-blue-400 font-bold hover:underline text-sm">
                  Create your first team
                </Link>
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Recent Games */}
        <div className="space-y-4 lg:pl-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">Recent Games</h2>
            <Link href="/games" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
              View All
            </Link>
          </div>

          {recentGames && recentGames.length > 0 ? (
            <div className="space-y-3">
              {recentGames.map((game: any) => (
                <Link 
                  key={game.id} 
                  href={`/games/${game.id}`}
                  className="flex flex-col bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors group"
                >
                  <div className="flex justify-between items-start w-full mb-2">
                    <span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md uppercase tracking-wider">
                      {new Date(game.game_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-extrabold text-gray-900 dark:text-white truncate">{game.teams?.name}</span>
                    <span className="text-xs font-bold text-gray-400">vs</span>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 truncate">
                      {game.opposing_team || 'TBD'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center flex flex-col items-center justify-center min-h-[250px]">
              <p className="text-gray-500 dark:text-gray-400 font-medium">No past games yet.</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}