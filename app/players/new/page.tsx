'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Position } from '@/types/models'

const AVAILABLE_POSITIONS: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF', 'DH', 'EH']

function AddPlayerForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const teamId = searchParams.get('teamId')

  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [preferredPositions, setPreferredPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const togglePosition = (pos: Position) => {
    setPreferredPositions(prev => 
      prev.includes(pos) 
        ? prev.filter(p => p !== pos)
        : [...prev, pos]
    )
  }

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamId || !name.trim()) return

    setLoading(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('players')
      .insert([
        { 
          team_id: teamId,
          name: name.trim(),
          number: number.trim() || null,
          preferred_positions: preferredPositions,
          status: 'active'
        }
      ])

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  if (!teamId) {
    return (
      <div className="p-8 text-center mt-12">
        <p className="text-gray-600">Missing team information. Please return to the dashboard.</p>
        <button onClick={() => router.push('/dashboard')} className="mt-4 text-blue-600 font-medium">
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border mt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add Player</h1>
        <p className="text-sm text-gray-600 mt-1">Add a new player to your roster.</p>
      </div>

      <form onSubmit={handleAddPlayer} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Jane Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jersey Number (Optional)</label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. 42"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Positions</label>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_POSITIONS.map(pos => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => togglePosition(pos)}
                  className={`p-2 rounded-lg text-sm font-medium border transition-colors ${
                    preferredPositions.includes(pos)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Adding...' : 'Add Player'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function NewPlayerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <Suspense fallback={<div className="text-center mt-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>}>
        <AddPlayerForm />
      </Suspense>
    </div>
  )
}