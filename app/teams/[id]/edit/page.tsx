'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Users } from 'lucide-react'
import { use } from 'react'
import { Suspense } from 'react'
import { useParams } from 'next/navigation'

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
  }, [id])

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 w-full pb-24">
      <div className="mb-8">
        <Link href="/teams" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Teams
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Edit Team</h1>
        <p className="text-gray-500 mt-2">Update your team's name and details.</p>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Users className="w-4 h-4 text-gray-400" /> Team Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. The Blue Barracudas"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900 font-medium"
          />
        </div>

        <div className="pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-lg"
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
  )
}
export default function EditTeamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-gray-950">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <EditTeamContent />
    </Suspense>
  )
}