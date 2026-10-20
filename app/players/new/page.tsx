'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

// Standard field positions for Kickball/Softball/Baseball
const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LC', 'RC', 'RF', 'EH']

function NewPlayerForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const teamId = searchParams.get('teamId')
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add or remove a position from the array when tapped
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
    
    if (!teamId) {
      setError('No team selected. Please go back to your team and try again.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Insert player into Supabase
      const { error: insertError } = await supabase
        .from('players')
        .insert([{ 
          team_id: teamId,
          name: trimmedName,
          number: number.trim() || null,
          preferred_positions: selectedPositions,
          status: 'active' // Default status
        }])

      if (insertError) throw insertError

      // Refresh and redirect back to the team roster
      router.refresh()
      router.push(`/teams/${teamId}`)
      
    } catch (err: any) {
      console.error('Error adding player:', err)
      setError(err.message || 'Failed to add player. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 w-full">
      {/* Back Navigation */}
      <Link 
        href={teamId ? `/teams/${teamId}` : '/teams'} 
        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Team
      </Link>

      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Add New Player</h1>
        <p className="text-gray-500 mt-2">Add a player to your roster and assign their preferred field positions.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

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
              placeholder="e.g. Jane Doe"
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
              placeholder="e.g. 42"
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
          <p className="text-xs text-gray-500 mt-2">Tap positions to toggle them on or off.</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
          <Link
            href={teamId ? `/teams/${teamId}` : '/teams'}
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
              'Add Player'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// Wrap the component that uses useSearchParams() in a Suspense boundary
export default function NewPlayerPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <NewPlayerForm />
    </Suspense>
  )
}