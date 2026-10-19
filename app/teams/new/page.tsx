'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NewTeamPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedName = name.trim()
    if (!trimmedName) return

    setLoading(true)
    setError(null)

    try {
      // 1. Get the currently logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('You must be logged in to create a team.')

      // 2. Insert the new team into Supabase
      const { data: newTeam, error: insertError } = await supabase
        .from('teams')
        .insert([{ 
          name: trimmedName,
          user_id: user.id // Links the team to your account
        }])
        .select()
        .single()

      if (insertError) throw insertError

      // 3. Force the router to refresh the data and redirect to the new team
      router.refresh()
      router.push(`/teams/${newTeam.id}`)
      
    } catch (err: any) {
      console.error('Error creating team:', err)
      setError(err.message || 'Failed to create team. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 w-full">
      {/* Back Navigation */}
      <Link 
        href="/teams" 
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Teams
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Create New Team</h1>
        <p className="text-gray-500 mt-2">Give your team a name to start building your roster.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Input Field */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-bold text-gray-900">
            Team Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Kickers"
            required
            maxLength={50}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href="/teams"
            className="px-6 py-3 text-gray-700 bg-gray-50 hover:bg-gray-100 font-bold rounded-xl text-center transition-colors border border-gray-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Create Team'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}