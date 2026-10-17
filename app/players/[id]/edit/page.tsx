'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Archive, UserCheck } from 'lucide-react'
import { Position } from '@/types/models'

const AVAILABLE_POSITIONS: Position[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LCF', 'RCF', 'RF', 'DH', 'EH']

export default function EditPlayerPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [preferredPositions, setPreferredPositions] = useState<Position[]>([])
  const [status, setStatus] = useState<'active' | 'archived'>('active')
  
  const [isFetching, setIsFetching] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchPlayer = async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', params.id)
        .single()

      if (data) {
        setName(data.name)
        setNumber(data.number || '')
        setPreferredPositions(data.preferred_positions || [])
        setStatus(data.status as 'active' | 'archived')
      } else if (error) {
        setError('Failed to load player data.')
      }
      setIsFetching(false)
    }
    
    fetchPlayer()
  }, [params.id, supabase])

  const togglePosition = (pos: Position) => {
    setPreferredPositions(prev => 
      prev.includes(pos) 
        ? prev.filter(p => p !== pos)
        : [...prev, pos]
    )
  }

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSaving(true)
    setError(null)

    const { error: updateError } = await supabase
      .from('players')
      .update({
        name: name.trim(),
        number: number.trim() || null,
        preferred_positions: preferredPositions,
        status: status
      })
      .eq('id', params.id)

    setIsSaving(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  if (isFetching) {
    return <div className="p-8 text-center mt-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border mt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Player</h1>
        <p className="text-sm text-gray-600 mt-1">Update details or archive this player.</p>
      </div>

      <form onSubmit={handleUpdatePlayer} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Player Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jersey Number</label>
            <input
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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

          <div className="pt-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Roster Status</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg font-medium transition-colors ${
                  status === 'active' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <UserCheck className="w-4 h-4" /> Active
              </button>
              <button
                type="button"
                onClick={() => setStatus('archived')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg font-medium transition-colors ${
                  status === 'archived' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Archive className="w-4 h-4" /> Archived
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Archived players will not appear in the draft wizard, but their past game records are preserved.
            </p>
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
            disabled={isSaving || !name.trim()}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}