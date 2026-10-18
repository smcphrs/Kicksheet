'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function NewTeamPage() {
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // Fetch the current user's ID on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUserId(session.user.id)
      } else {
        router.push('/login')
      }
    }
    getUser()
  }, [router, supabase.auth])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId || !teamName.trim()) return

    setLoading(true)
    setError(null)

    // Insert the new team into Supabase
    const { error: insertError } = await supabase
      .from('teams')
      .insert([
        { 
          name: teamName.trim(),
          owner_id: userId 
        }
      ])

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      router.push('/dashboard')
      router.refresh() // Refresh server components to show the new team
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create a Team</h1>
          <p className="text-sm text-gray-600 mt-1">
            Give your kickball team a name to get started. You can add players to your roster next.
          </p>
        </div>

        <form onSubmit={handleCreateTeam} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
              placeholder="e.g. The Kickaholics"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !teamName.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}