import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Plus, Users, ChevronRight } from 'lucide-react'

// Block prerendering to ensure live database fetches
export const instant = false

// Maintain your exact color hashing logic for the avatars
function getTeamColor(name: string): string {
  const colors = [
    '#2D7A3A', '#1E88E5', '#8E24AA', '#E53935',
    '#F4511E', '#039BE5', '#00897B', '#7CB342',
    '#FB8C00', '#6D4C41',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default async function TeamsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Fetch teams directly from Supabase instead of local storage
  const { data: teams, error } = await supabase
    .from('teams')
    .select(`*, players (*)`)
    .order('created_at', { ascending: false })

  const MAX_TEAMS = 8
  const currentTeams = teams || []
  const atTeamLimit = currentTeams.length >= MAX_TEAMS

  return (
    <div className="max-w-4xl mx-auto p-6 w-full space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Teams</h1>
        
        {atTeamLimit ? (
          <button 
            disabled
            className="bg-gray-300 w-10 h-10 rounded-xl flex items-center justify-center cursor-not-allowed opacity-50"
            title="Team limit reached"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        ) : (
          <Link 
            href="/teams/new"
            className="bg-blue-600 hover:bg-blue-700 transition-colors w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
          >
            <Plus className="w-6 h-6 text-white" />
          </Link>
        )}
      </header>

      {/* Empty State */}
      {(!currentTeams || currentTeams.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mt-8">
          <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6">
            <Users className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No teams yet</h2>
          <p className="text-gray-500 mb-8 max-w-sm">
            Create your first team to start managing players and building lineups.
          </p>
          <Link 
            href="/teams/new"
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Create Team
          </Link>
        </div>
      )}

      {/* Teams List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentTeams.map((team) => {
          const activeCount = team.players?.filter((p: any) => p.status === 'active').length || 0
          const activeLabel = activeCount === 1 ? '1 active player' : `${activeCount} active players`
          const hasThumbnail = !!team.thumbnailUri

          return (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all group"
            >
              {/* Thumbnail / Avatar */}
              {hasThumbnail ? (
                <img
                  src={team.thumbnailUri}
                  alt={team.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: getTeamColor(team.name) }}
                >
                  <span className="text-2xl font-extrabold text-white">
                    {team.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {team.name}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {activeLabel}
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}