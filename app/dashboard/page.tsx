import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Users, User, Calendar, Plus, ChevronRight, MapPin, Clock } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // 1. Authenticate user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 2. Fetch Accurate Counts
  const [
    { count: teamsCount },
    { count: playersCount },
    { count: gamesCount }
  ] = await Promise.all([
    supabase.from('teams').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('players').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('games').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  ])

  // 3. Fetch Next Game & Recent Games
  const today = new Date().toISOString().split('T')[0]
  
  const { data: nextGames } = await supabase
    .from('games')
    .select('*, teams(name)')
    .eq('user_id', user.id)
    .gte('game_date', today)
    .order('game_date', { ascending: true })
    .limit(1)
    
  const nextGame = nextGames && nextGames.length > 0 ? nextGames[0] : null

  const { data: recentGames } = await supabase
    .from('games')
    .select('*, teams(name)')
    .eq('user_id', user.id)
    .lt('game_date', today)
    .order('game_date', { ascending: false })
    .limit(3)

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 w-full space-y-6 sm:space-y-8 pb-24">
      
      {/* Mobile-Only Welcome Header (Hidden on Desktop) */}
      <div className="md:hidden bg-green-600 dark:bg-green-700 p-6 rounded-3xl text-white shadow-sm">
        <h1 className="text-2xl font-extrabold mb-1">Welcome to Kicksheet</h1>
        <p className="text-green-100 text-sm font-medium">Manage your lineups like a pro.</p>
      </div>

      {/* Quick Actions Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="hidden md:block">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Overview of your teams and upcoming games.</p>
        </div>
        
        <Link 
          href="/games/new"
          className="w-full sm:w-auto text-center bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Game
        </Link>
      </div>

      {/* Accurate Stats Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6">
        <Link href="/teams" className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900 transition-colors group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{teamsCount || 0}</h3>
          <p className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Teams</p>
        </Link>

        <Link href="/players" className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-green-200 dark:hover:border-green-900/50 transition-colors group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{playersCount || 0}</h3>
          <p className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Players</p>
        </Link>

        <Link href="/games" className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-900/50 transition-colors group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">{gamesCount || 0}</h3>
          <p className="text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Games</p>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
        {/* Next Game Widget */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Next Game</h2>
          </div>
          
          {nextGame ? (
            <Link href={`/games/${nextGame.id}`} className="block bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Calendar className="w-24 h-24 text-white" />
              </div>
              
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider rounded-full mb-4 border border-blue-500/30">
                  Upcoming
                </span>
                <h3 className="text-2xl font-extrabold text-white mb-1">{nextGame.teams?.name}</h3>
                <p className="text-gray-400 font-medium mb-6">vs {nextGame.opposing_team || 'TBD'}</p>
                
                <div className="space-y-2.5">
                  <div className="flex items-center text-gray-300 text-sm font-medium">
                    <Calendar className="w-4 h-4 mr-3 text-gray-500" />
                    {new Date(nextGame.game_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                  <div className="flex items-center text-gray-300 text-sm font-medium">
                    <Clock className="w-4 h-4 mr-3 text-gray-500" />
                    {nextGame.game_time || 'Time TBD'}
                  </div>
                  {nextGame.field && (
                    <div className="flex items-center text-gray-300 text-sm font-medium">
                      <MapPin className="w-4 h-4 mr-3 text-gray-500" />
                      {nextGame.location ? `${nextGame.location} (${nextGame.field})` : nextGame.field}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center flex flex-col items-center justify-center min-h-[250px]">
              <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium mb-4">No upcoming games scheduled.</p>
              <Link href="/games/new" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                Schedule one now
              </Link>
            </div>
          )}
        </div>

        {/* Recent Games List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Games</h2>
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
                  className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900 dark:text-white">{game.teams?.name}</span>
                      <span className="text-xs text-gray-400">vs</span>
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 truncate max-w-[100px] sm:max-w-[150px]">
                        {game.opposing_team || 'TBD'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                      {new Date(game.game_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors shrink-0">
                    <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-center flex flex-col items-center justify-center h-full min-h-[250px]">
              <p className="text-gray-500 dark:text-gray-400 font-medium">No past games yet.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}