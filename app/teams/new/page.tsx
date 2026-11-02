'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2, Shield } from 'lucide-react'

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
          owner_id: user.id // Links the team to your account
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
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pt-12 sm:pt-24 w-full pb-24">
        
        {/* Back Navigation */}
        <Link 
          href="/teams" 
          className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Teams
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">Create New Team</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium text-lg tracking-tight">Give your team a name to start building your roster.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-300 dark:border-gray-700 space-y-6 transition-colors">
          
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
              {error}
            </div>
          )}

          {/* Input Field */}
          <div className="space-y-3">
            <label htmlFor="name" className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Team Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Kickers"
              required
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 font-bold transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-300 dark:border-gray-700">
            <Link
              href="/teams"
              className="px-6 py-3.5 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold rounded-xl text-center transition-colors border border-gray-300 dark:border-gray-700 active:scale-95"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  )
}