import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Calendar, Clock, MapPin, ChevronRight, Plus } from 'lucide-react'

export default async function GamesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // 1. Get the logged-in user
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Fetch all games owned by this user, ordered by date
  let games: any[] = []
  if (user) {
    const { data, error } = await supabase
      .from('games')
      .select('*, teams(name)')
      .eq('user_id', user.id)
      .order('game_date', { ascending: false })

    if (error) console.error('Error fetching games:', error)
    if (data) games = data
  }

  // Separate into Upcoming and Past games
  const today = new Date().toISOString().split('T')[0]
  const upcomingGames = games.filter(g => g.game_date >= today)
  const pastGames = games.filter(g => g.game_date < today)

  return (
    <div className="max-w-4xl mx-auto p-6 w-full space-y-8 pb-24">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Games</h1>
          <p className="text-gray-500 mt-1 font-medium">Manage your lineups and history</p>
        </div>
        
        <Link 
          href="/games/new"
          className="w-full sm:w-auto text-center bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Game
        </Link>
      </header>

      {games.length === 0 ? (
        <div className="bg-white p-10 text-center border-2 border-dashed border-gray-200 rounded-3xl">
          <h3 className="text-xl font-bold text-gray-900 mb-2">No games yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">Create your first game to generate a lineup, track attendance, and assign field positions.</p>
          <Link 
            href="/games/new"
            className="inline-flex bg-white text-blue-600 border border-gray-200 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors"
          >
            Create First Game
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Games */}
          {upcomingGames.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 px-1">Upcoming Games</h2>
              <div className="grid gap-4">
                {upcomingGames.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </section>
          )}

          {/* Past Games */}
          {pastGames.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 px-1 mt-8">Past Games</h2>
              <div className="grid gap-4 opacity-80">
                {pastGames.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

// Helper component for the game cards
function GameCard({ game }: { game: any }) {
  const formattedDate = game.game_date 
    ? new Date(game.game_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : 'TBD'

  return (
    <Link 
      href={`/games/${game.id}`}
      className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group flex items-center justify-between"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-lg text-gray-900">{game.teams?.name}</span>
          <span className="text-gray-400 font-medium text-sm">vs</span>
          <span className="font-bold text-gray-700">{game.opposing_team || 'TBA'}</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            {formattedDate}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            {game.game_time || 'TBD'}
          </div>
          {game.field && (
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <MapPin className="w-4 h-4 text-blue-600" />
              {game.location ? `${game.location} (${game.field})` : game.field}
            </div>
          )}
        </div>
      </div>

      <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center transition-colors shrink-0">
        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
      </div>
    </Link>
  )
}