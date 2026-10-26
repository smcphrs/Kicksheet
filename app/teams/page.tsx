'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Users, Edit2, Trash2, Plus, Loader2, ArrowLeft } from 'lucide-react'

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
      // CHANGE THIS LINE to owner_id:
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
        // If the database blocks the delete due to foreign keys (e.g., players/games are attached)
        if (deleteError.code === '23503') {
          throw new Error(`Cannot delete ${name}. You must delete all players and games associated with this team first.`)
        }
        throw deleteError
      }

      // Remove the team from the UI instantly
      setTeams(teams.filter(t => t.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete team.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 w-full space-y-8 pb-24">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Manage Teams</h1>
          <p className="text-gray-500 mt-1 font-medium">Edit or delete your existing teams.</p>
        </div>
        
        <Link 
          href="/teams/new"
          className="w-full sm:w-auto text-center bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700 font-bold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Team
        </Link>
      </header>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : teams.length === 0 ? (
        <div className="bg-white p-10 text-center border-2 border-dashed border-gray-200 rounded-3xl">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No teams found</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">You haven't created any teams yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {teams.map(team => (
            <div key={team.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-blue-100 dark:hover:border-blue-900/50 transition-all">
              
              {/* Make the left side clickable to view the Roster! */}
              <Link href={`/teams/${team.id}`} className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{team.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Created {new Date(team.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link 
                  href={`/teams/${team.id}/edit`}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                >
                  <Edit2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Rename</span>
                </Link>
                <button 
                  onClick={() => handleDeleteTeam(team.id, team.name)}
                  disabled={deletingId === team.id}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 font-bold rounded-lg transition-colors border border-red-100 dark:border-red-900/50 disabled:opacity-50"
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
  )
}