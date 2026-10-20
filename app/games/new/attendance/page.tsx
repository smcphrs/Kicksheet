'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useDraftStore } from '@/store/useDraftStore'
import Link from 'next/link'
import { ArrowLeft, Check, Plus, X, User, Loader2 } from 'lucide-react'

export default function AttendanceStep2() {
  const router = useRouter()
  const supabase = createClient()
  const store = useDraftStore()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [roster, setRoster] = useState<any[]>([])

  // Form State
  const [attendingIds, setAttendingIds] = useState<string[]>([])
  const [subs, setSubs] = useState<any[]>([])
  const [newSubName, setNewSubName] = useState('')

  useEffect(() => {
    setMounted(true)
    
    // Security check: If they somehow got here without selecting a team, send them back
    if (!store.selectedTeamId) {
      router.replace('/games/new')
      return
    }

    async function fetchRoster() {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', store.selectedTeamId)
        .eq('status', 'active')
        .order('name')

      if (data) {
        setRoster(data)
        
        // UX trick: If this is a fresh draft, assume EVERYONE is attending by default.
        // If they already saved attendance in this draft, load it.
        if (store.attendingPlayers && store.attendingPlayers.length > 0) {
          // Ensure we only check IDs that belong to the current team (in case they changed teams in Step 1)
          const validIds = store.attendingPlayers.filter(id => data.some(p => p.id === id))
          setAttendingIds(validIds.length > 0 ? validIds : data.map(p => p.id))
        } else {
          setAttendingIds(data.map(p => p.id))
        }
      }
      
      if (store.subs) setSubs(store.subs)
      setLoading(false)
    }

    fetchRoster()
  }, [])

  // Toggle a regular roster player's attendance
  const togglePlayer = (id: string) => {
    setAttendingIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    )
  }

  // Add a substitute player (saved temporarily to the draft, not permanently to the DB yet)
  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newSubName.trim()
    if (!trimmed) return

    const newSub = {
      id: `sub-${Date.now()}`, // Temporary unique ID
      name: trimmed,
      team_id: store.selectedTeamId,
      status: 'active',
      isSub: true
    }

    setSubs([...subs, newSub])
    setNewSubName('')
  }

  const handleRemoveSub = (subId: string) => {
    setSubs(subs.filter(s => s.id !== subId))
  }

  const handleContinue = () => {
    // Save the selections to the Zustand auto-persisting store
    store.setAttendingPlayers(attendingIds)
    store.setSubs(subs)
    store.setCurrentStep(2)

    // Move to the Kicking Order step!
    router.push('/games/new/kicking-order')
  }

  if (!mounted) return null
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const totalAttending = attendingIds.length + subs.length

  return (
    <div className="max-w-2xl mx-auto p-6 w-full pb-24">
      <div className="flex items-center justify-between mb-8">
        <Link href="/games/new" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Details
        </Link>
        <span className="text-sm font-bold text-gray-400">Step 2 of 4</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Attendance</h1>
        <p className="text-gray-500 mt-2">Who is playing today? Tap to toggle.</p>
      </div>

      <div className="space-y-8">
        
        {/* Roster Grid */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Active Roster</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {roster.map((player) => {
              const isAttending = attendingIds.includes(player.id)
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`flex items-center p-3 rounded-xl border text-left transition-all ${
                    isAttending 
                      ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 shrink-0 transition-colors ${
                    isAttending ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {isAttending && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`font-bold text-sm truncate ${isAttending ? 'text-blue-900' : 'text-gray-600'}`}>
                    {player.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Subs Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Substitute Players</h2>
          
          <form onSubmit={handleAddSub} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSubName}
              onChange={(e) => setNewSubName(e.target.value)}
              placeholder="Sub name..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-sm"
            />
            <button
              type="submit"
              disabled={!newSubName.trim()}
              className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl disabled:opacity-50 transition-colors text-sm flex items-center"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </button>
          </form>

          {subs.length > 0 && (
            <div className="space-y-2">
              {subs.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50/50">
                  <div className="flex items-center text-blue-900 font-bold text-sm">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    {sub.name} <span className="ml-2 text-[10px] uppercase bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Sub</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveSub(sub.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded-md hover:bg-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Continue Footer */}
        <div>
          <div className="text-center mb-4 text-sm font-bold text-gray-500">
            Total Playing: <span className="text-gray-900 text-base">{totalAttending}</span>
          </div>
          <button
            onClick={handleContinue}
            disabled={totalAttending === 0}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-lg"
          >
            Continue to Kicking Order
          </button>
        </div>

      </div>
    </div>
  )
}