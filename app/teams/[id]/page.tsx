import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, UserPlus, Edit2, Shield, Users } from 'lucide-react'

// Use the exact same color logic from the lineup page
const getPositionColors = (pos: string) => {
  switch (pos) {
    case 'P': return 'bg-fuchsia-500 text-white'
    case 'C': return 'bg-rose-500 text-white'
    case '1B': return 'bg-yellow-400 text-yellow-950'
    case '2B': return 'bg-amber-500 text-white'
    case '3B': return 'bg-orange-500 text-white'
    case 'SS': return 'bg-red-500 text-white'
    case 'LF': return 'bg-lime-400 text-lime-950'
    case 'LC': return 'bg-green-500 text-white'
    case 'RC': return 'bg-emerald-500 text-white'
    case 'RF': return 'bg-teal-500 text-white'
    default: return 'bg-blue-500 text-white'
  }
}

export default async function TeamRosterPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Fetch the team details
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single()

  if (teamError || !team) {
    notFound()
  }

  // Fetch the players on this team
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', id)
    .order('name', { ascending: true })

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 w-full space-y-6 sm:space-y-8 pb-24">
      <Link href="/teams" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Teams
      </Link>

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {team.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
              {players?.length || 0} Active Players
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Link 
            href={`/teams/${team.id}/edit`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors border border-gray-200 dark:border-gray-700 shadow-sm"
          >
            Team Settings
          </Link>
          <Link 
            href={`/players/new?team_id=${team.id}`}
            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Add Player
          </Link>
        </div>
      </header>

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 px-1">Roster</h2>
        
        {!players || players.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-10 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl transition-colors">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No players yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Add your first player to start building your lineup.</p>
            <Link 
              href={`/players/new?team_id=${team.id}`}
              className="inline-flex bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-gray-200 dark:border-gray-700 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Add First Player
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {players.map((player) => (
              <div key={player.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700 font-black text-gray-400 dark:text-gray-500 text-lg">
                    {player.number || '#'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{player.name}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {player.preferred_positions && player.preferred_positions.length > 0 ? (
                        player.preferred_positions.map((pos: string) => {
                          const colors = getPositionColors(pos);
                          return (
                            <span key={pos} className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold shadow-sm transition-colors uppercase tracking-wider ${colors}`}>
                              {pos}
                            </span>
                          )
                        })
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">No preferred positions</span>
                      )}
                    </div>
                  </div>
                </div>

                <Link 
                  href={`/players/${player.id}/edit`}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-colors border border-gray-200 dark:border-gray-700"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}