'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2, Archive, UserCheck } from 'lucide-react'
import { Suspense } from 'react'
import { useParams } from 'next/navigation'

const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LC', 'RC', 'RF']

function EditPlayerContent() {
  const params = useParams()
  const id = params.id as string 
  const router = useRouter()
  const supabase = createClient()
  
  // Unwrap the params Promise (Next.js 15+ requirement)
  const { id } = use(params)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Player Data States
  const [teamId, setTeamId] = useState<string>('')
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  const [status, setStatus] = useState<'active' | 'archived'>('active')

  // Fetch existing player data on load
  useEffect(() => {
    async function fetchPlayer() {
      try {
        const { data: player, error: fetchError } = await supabase
          .from('players')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError) throw fetchError

        if (player) {
          setName(player.name)
          setNumber(player.number || '')
          setSelectedPositions(player.preferred_positions || [])
          setStatus(player.status || 'active')
          setTeamId(player.team_id)
        }
      } catch (err: any) {
        console.error('Error fetching player:', err)
        setError('Failed to load player data.')
      } finally {
        setLoading(false)
      }
    }

    fetchPlayer()
  }, [id, supabase])

  const togglePosition = (pos: string) => {
    setSelectedPositions(prev => 
      prev.includes(pos) 
        ? prev.filter(p => p !== pos)
        : [...prev, pos]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedName = name.trim()
    if (!trimmedName) return

    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('players')
        .update({ 
          name: trimmedName,
          number: number.trim() || null,
          preferred_positions: selectedPositions,
          status: status
        })
        .eq('id', id)

      if (updateError) throw updateError

      router.refresh()
      router.push(`/teams/${teamId}`)
      
    } catch (err: any) {
      console.error('Error updating player:', err)
      setError(err.message || 'Failed to update player. Please try again.')
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
    <div className="max-w-2xl mx-auto p-6 w-full">
      {/* Back Navigation */}
      <Link 
        href={`/teams/${teamId}`} 
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Team
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Edit Player</h1>
        <p className="text-gray-500 mt-2">Update roster details, positions, or archive this player.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Status Toggle */}
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
          <label className="block text-sm font-bold text-gray-900 mb-3">
            Player Status
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus('active')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-all border ${
                status === 'active'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatus('archived')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-sm transition-all border ${
                status === 'archived'
                  ? 'bg-gray-800 text-white border-gray-800 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Archive className="w-4 h-4" />
              Archived
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Archived players keep their historical stats but are hidden from active game lineups.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-bold text-gray-900">
              Player Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="number" className="block text-sm font-bold text-gray-900">
              Jersey Number <span className="font-normal text-gray-500">(Optional)</span>
            </label>
            <input
              id="number"
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              maxLength={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900"
            />
          </div>
        </div>

        {/* Position Selector */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-900">
            Preferred Positions
          </label>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map(pos => {
              const isSelected = selectedPositions.includes(pos)
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => togglePosition(pos)}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
                    isSelected 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {pos}
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href={`/teams/${teamId}`}
            className="px-6 py-3 text-gray-700 bg-gray-50 hover:bg-gray-100 font-bold rounded-xl text-center transition-colors border border-gray-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
export default function EditPlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-gray-950">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <EditPlayerContent />
    </Suspense>
  )
}