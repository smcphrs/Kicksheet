'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Users } from 'lucide-react'

function EditTeamContent() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTeam() {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        setError('Team not found.')
      } else if (data) {
        setName(data.name)
      }
      setLoading(false)
    }

    fetchTeam()
  }, [id, supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('teams')
        .update({ name })
        .eq('id', id)

      if (updateError) throw updateError

      // Return to the manage teams page on success
      router.push('/teams')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update team.')
      setSaving(false)
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
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pt-12 sm:pt-24 w-full pb-24">
        <Link href="/teams" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Teams
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">Edit Team</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium text-lg tracking-tight">Update your team's name and details.</p>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-300 dark:border-gray-700 space-y-6 transition-colors">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Team Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. The Blue Barracudas"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 font-bold transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="pt-6 border-t border-gray-300 dark:border-gray-700">
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Team
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EditTeamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <EditTeamContent />
    </Suspense>
  )
}