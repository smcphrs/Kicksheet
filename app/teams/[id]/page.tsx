import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Plus, Pencil, Settings } from 'lucide-react'

// Block prerendering to ensure live database fetches
export const instant = false

export default async function TeamDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Next.js 15+ requires awaiting params
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: team, error } = await supabase
    .from('teams')
    .select(`*, players (*)`)
    .eq('id', id)
    .single()

  if (error || !team) {
    notFound()
  }

  // Sort players: active first, then alphabetically
  const sortedPlayers = [...(team.players || [])].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1
    if (a.status !== 'active' && b.status === 'active') return 1
    return a.name.localeCompare(b.name)
  })

  const activeCount = sortedPlayers.filter(p => p.status === 'active').length

  return (
    <div className="max-w-4xl mx-auto p-6 w-full space-y-6">
      {/* Navigation Header */}
      <Link href="/teams" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Teams
      </Link>

      {/* Team Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{team.name}</h1>
          <p className="text-gray-500 mt-1 font-medium">{activeCount} active players</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <Link 
            href={`/teams/${team.id}/edit`}
            className="flex-1 sm:flex-none text-center bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-100 font-medium transition-colors inline-flex items-center justify-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Manage
          </Link>
          <Link 
            href={`/players/new?teamId=${team.id}`}
            className="flex-1 sm:flex-none text-center bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add Player
          </Link>
        </div>
      </header>

      {/* Roster Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 px-1">Roster</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedPlayers.map((player) => (
            <div 
              key={player.id} 
              className={`p-5 rounded-2xl border transition-all relative group ${
                player.status === 'archived' ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100'
              }`}
            >
              <Link 
                href={`/players/${player.id}/edit`} 
                className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-1.5 bg-gray-50 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <Pencil className="w-4 h-4" />
              </Link>
              
              <div className="pr-8">
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  {player.name}
                  {player.status === 'archived' && (
                    <span className="text-[10px] uppercase tracking-wider bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                      Archived
                    </span>
                  )}
                </h3>
                <p className="text-gray-500 text-sm font-medium mt-0.5">
                  Number: {player.number || 'N/A'}
                </p>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-1.5">
                {player.preferred_positions?.map((pos: string) => (
                  <span key={pos} className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200">
                    {pos}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {sortedPlayers.length === 0 && (
            <div className="col-span-full p-10 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Roster is empty</h3>
              <p className="text-gray-500 mb-6">Add players to start building your lineup.</p>
              <Link 
                href={`/players/new?teamId=${team.id}`}
                className="inline-flex bg-white text-blue-600 border border-gray-200 px-6 py-2.5 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors"
              >
                Add First Player
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}