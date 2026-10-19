import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { 
  Trophy, 
  Plus, 
  Calendar, 
  Users, 
  UsersRound, 
  User, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Flag 
} from 'lucide-react'

// Required for Next.js 16 caching compatibility
export const instant = false

// Helper: Generate consistent colors for team thumbnails
function getTeamColorClass(name: string): string {
  const colors = [
    'bg-green-600', 'bg-blue-600', 'bg-purple-600', 'bg-red-600',
    'bg-orange-600', 'bg-sky-600', 'bg-teal-600', 'bg-lime-600',
    'bg-amber-600', 'bg-stone-600',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Helper: Combine date and time for accurate sorting
function getGameDateTime(game: any): Date {
  if (!game.game_time) return new Date(game.game_date)
  
  const [time, meridiem] = game.game_time.split(' ')
  const [hourStr, minStr] = time.split(':')
  let hour = parseInt(hourStr, 10)
  const min = parseInt(minStr, 10)
  
  if (meridiem === 'PM' && hour !== 12) hour += 12
  if (meridiem === 'AM' && hour === 12) hour = 0
  
  const d = new Date(game.game_date)
  d.setHours(hour, min, 0, 0)
  return d
}

// Helper: Format date for display
function formatGameDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Helper: Calculate days until game
function getDaysUntil(date: Date): string {
  const now = new Date()
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const gameMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diff = Math.round((gameMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return `In ${diff} days`
}

export default async function Dashboard() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Fetch all required dashboard data in parallel
  const [
    { data: teams }, 
    { data: allGames },
    { data: draft }
  ] = await Promise.all([
    supabase.from('teams').select(`*, players (*)`).order('created_at', { ascending: false }),
    supabase.from('game_lineups').select('*'),
    // Graceful fallback for drafts table in case it relies on local storage instead
    supabase.from('game_drafts').select('*').limit(1).maybeSingle()
  ])

  // Process Teams Data
  const safeTeams = teams || []
  const hasTeams = safeTeams.length > 0
  const totalTeams = safeTeams.length
  const totalActivePlayers = safeTeams.reduce(
    (sum, t) => sum + (t.players?.filter((p: any) => p.status === 'active').length || 0),
    0
  )

  // Process Games Data
  const safeGames = allGames || []
  const totalGames = safeGames.length
  const now = new Date()
  
  const upcomingGames = safeGames
    .filter(g => getGameDateTime(g) > now)
    .sort((a, b) => getGameDateTime(a).getTime() - getGameDateTime(b).getTime())
    .slice(0, 3)

  const recentGames = safeGames
    .filter(g => getGameDateTime(g) <= now)
    .sort((a, b) => getGameDateTime(b).getTime() - getGameDateTime(a).getTime())
    .slice(0, 3)

  const nextGame = upcomingGames.length > 0 ? upcomingGames[0] : null
  const additionalUpcoming = upcomingGames.slice(1)

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-green-700 pt-12 pb-6 px-4 sm:px-6 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Kicksheet</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 space-y-8">
        
        {/* Draft Banner */}
        {draft && (
          <Link href="/games/new" className="block">
            <div className="bg-green-50 border-2 border-green-600 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:bg-green-100 transition-colors">
              <div>
                <h3 className="text-green-800 font-bold text-sm">Draft in Progress</h3>
                <p className="text-green-600 text-xs mt-1">
                  {draft.opposing_team ? `vs ${draft.opposing_team}` : 'Untitled game'} · Step {draft.step || 1} of 4
                </p>
              </div>
              <ChevronRight className="text-green-600 w-5 h-5" />
            </div>
          </Link>
        )}

        {/* Empty State */}
        {!hasTeams && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-sm border border-gray-100">
            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Kicksheet</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed">
              Create your first team to start building lineups and tracking your games.
            </p>
            <Link 
              href="/teams/new" 
              className="inline-flex bg-green-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm"
            >
              Create Your First Team
            </Link>
          </div>
        )}

        {hasTeams && (
          <>
            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link 
                href="/games/new"
                className="flex-1 bg-green-600 text-white rounded-2xl p-4 flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-sm"
              >
                <Plus className="w-5 h-5" />
                <span className="font-bold">New Game</span>
              </Link>
              <Link 
                href="/teams"
                className="flex-1 bg-white text-green-700 border-2 border-green-600 rounded-2xl p-4 flex items-center justify-center gap-2 hover:bg-green-50 transition-colors shadow-sm"
              >
                <Users className="w-5 h-5" />
                <span className="font-bold">Manage Teams</span>
              </Link>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-gray-100">
                <UsersRound className="w-6 h-6 text-green-600 mb-2" />
                <span className="text-xl font-extrabold text-gray-900">{totalTeams}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Teams</span>
              </div>
              <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-gray-100">
                <User className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-xl font-extrabold text-gray-900">{totalActivePlayers}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Players</span>
              </div>
              <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm border border-gray-100">
                <Calendar className="w-6 h-6 text-sky-500 mb-2" />
                <span className="text-xl font-extrabold text-gray-900">{totalGames}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Games</span>
              </div>
            </div>

            {/* Next Game Card */}
            {nextGame && (
              <div>
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                  <div className="bg-green-700 px-5 py-2.5 flex justify-between items-center">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Next Game</span>
                    <span className="text-xs font-medium text-green-100">{getDaysUntil(getGameDateTime(nextGame))}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      vs {nextGame.opposing_team || 'TBD'}
                    </h3>
                    <div className="space-y-2.5 mb-6">
                      <div className="flex items-center gap-3 text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formatGameDate(nextGame.game_date)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{nextGame.game_time}</span>
                      </div>
                      {nextGame.location && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{nextGame.location}</span>
                        </div>
                      )}
                      {nextGame.field && (
                        <div className="flex items-center gap-3 text-gray-600">
                          <Flag className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{nextGame.field}</span>
                        </div>
                      )}
                    </div>
                    <Link 
                      href={`/games/${nextGame.id}`}
                      className="block w-full bg-gray-900 text-white text-center py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors"
                    >
                      View Lineup
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* My Teams Preview */}
            {safeTeams.length > 0 && (
              <div>
                <div className="flex justify-between items-end mb-4 px-1">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">My Teams</h3>
                  <Link href="/teams" className="text-sm font-semibold text-green-600 flex items-center hover:text-green-700">
                    See All <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Link>
                </div>
                <div className="flex overflow-x-auto pb-4 gap-4 hide-scrollbar">
                  {safeTeams.map((team: any) => {
                    const activeCount = team.players?.filter((p: any) => p.status === 'active').length || 0
                    const bgColor = getTeamColorClass(team.name)
                    
                    return (
                      <Link key={team.id} href={`/teams/${team.id}`} className="flex-shrink-0 group">
                        <div className="bg-white w-24 rounded-2xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-shadow">
                          <div className={`w-24 h-24 ${bgColor} flex items-center justify-center`}>
                            <span className="text-3xl font-black text-white">
                              {team.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="p-3 text-center">
                            <h4 className="text-xs font-bold text-gray-900 truncate">{team.name}</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">{activeCount} players</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Games */}
            {additionalUpcoming.length > 0 && (
              <div>
                <div className="flex justify-between items-end mb-4 px-1">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upcoming</h3>
                  <Link href="/games/past" className="text-sm font-semibold text-green-600 flex items-center hover:text-green-700">
                    See All <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {additionalUpcoming.map((game: any) => (
                    <Link key={game.id} href={`/games/${game.id}`} className="block">
                      <div className="bg-white rounded-2xl p-4 flex items-center border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-sm">vs {game.opposing_team || 'TBD'}</h4>
                          <div className="flex gap-4 mt-1.5 text-xs">
                            <span className="text-gray-500">{formatGameDate(game.game_date)}</span>
                            {game.location && <span className="text-gray-400">{game.location}</span>}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Games */}
            {recentGames.length > 0 && (
              <div>
                <div className="flex justify-between items-end mb-4 px-1">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recent Games</h3>
                  <Link href="/games/past" className="text-sm font-semibold text-green-600 flex items-center hover:text-green-700">
                    See All <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentGames.map((game: any) => (
                    <Link key={game.id} href={`/games/${game.id}`} className="block">
                      <div className="bg-white rounded-2xl p-4 flex items-center border-l-4 border-l-gray-300 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-sm">vs {game.opposing_team || 'Unknown'}</h4>
                          <div className="flex gap-4 mt-1.5 text-xs">
                            <span className="text-gray-500">{formatGameDate(game.game_date)}</span>
                            {game.location && <span className="text-gray-400">{game.location}</span>}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* CSS to hide horizontal scrollbar on teams list for cleaner UI */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  )
}