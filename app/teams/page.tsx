'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Users, Edit2, Trash2, Plus, Loader2, ArrowLeft, Shield } from 'lucide-react'

export default function ManageTeamsPage() {
  const supabase = createClient()
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTeams()
  }, [])

  async function fetchTeams() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    
    if (data) setTeams(data)
    setLoading(false)
  }

  async function handleDeleteTeam(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return
    }

    setDeletingId(id)
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)

      if (deleteError) {
        if (deleteError.code === '23503') {
          throw new Error(`Cannot delete ${name}. You must delete all players and games associated with this team first.`)
        }
        throw deleteError
      }

      setTeams(teams.filter(t => t.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete team.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

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
              Manage Teams
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium text-lg tracking-tight">Click a team to view and edit it's players.</p>
          </div>
          
          <div className="flex w-full sm:w-auto">
            <Link 
              href="/teams/new"
              className="flex-1 sm:flex-none text-center bg-[#0a192f] dark:bg-blue-200 text-white dark:text-[#0a192f] border border-gray-300 dark:border-gray-700 px-6 py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-blue-300 font-bold transition-colors active:scale-95 inline-flex items-center justify-center gap-2 group"
            >
              <Plus className="w-5 h-5 text-white dark:text-[#0a192f] transition-colors" />
              New Team
            </Link>
          </div>
        </header>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
            {error}
          </div>
        )}

        <div className="space-y-3 sm:space-y-4">
          {/* Stats Header Bar */}
          <div className="w-full bg-gray-200/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 flex items-center justify-between mb-4">
            <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
              Active Teams
            </h2>
          </div>

          {teams.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 p-10 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl transition-colors">
              <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No teams found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto font-medium">You haven't created any teams yet.</p>
              <Link 
                href="/teams/new"
                className="inline-flex bg-[#0a192f] dark:bg-blue-200 text-white dark:text-[#0a192f] border border-gray-300 dark:border-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-blue-300 transition-colors active:scale-95"
              >
                Create a Team
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {teams.map(team => (
                <div key={team.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-300 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  
                  <Link href={`/teams/${team.id}`} className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 group-hover:bg-[#2563eb] group-hover:border-blue-700">
                      <span className="text-xl font-black text-[#2563eb] dark:text-blue-400 group-hover:text-white transition-colors uppercase">
                        {team.name ? team.name.charAt(0) : '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-gray-900 dark:text-white tracking-tight">{team.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-bold uppercase tracking-wider group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Manage Roster
                      </p>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link 
                      href={`/teams/${team.id}/edit`}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors border border-gray-300 dark:border-gray-700 active:scale-95"
                    >
                      <Edit2 className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Rename</span>
                    </Link>
                    <button 
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      disabled={deletingId === team.id}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-xl transition-colors border border-red-200 dark:border-red-900/50 disabled:opacity-50 active:scale-95"
                    >
                      {deletingId === team.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Delete</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}