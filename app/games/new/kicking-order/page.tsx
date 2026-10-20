'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useDraftStore } from '@/store/useDraftStore'
import Link from 'next/link'
import { ArrowLeft, GripVertical, Loader2, User } from 'lucide-react'
import { Reorder } from 'framer-motion'

export default function KickingOrderStep3() {
  const router = useRouter()
  const supabase = createClient()
  const store = useDraftStore()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
    
    // Security check
    if (!store.selectedTeamId || (store.attendingPlayers.length === 0 && store.subs.length === 0)) {
      router.replace('/games/new/attendance')
      return
    }

    async function fetchPlayers() {
      let fetchedRoster: any[] = []

      // Only fetch if there are actual attending players (not just subs)
      if (store.attendingPlayers.length > 0) {
        const { data } = await supabase
          .from('players')
          .select('id, name, number, preferred_positions')
          .in('id', store.attendingPlayers)
        
        if (data) fetchedRoster = data
      }

      // Combine roster players with temporary subs
      const combinedPlayers = [
        ...fetchedRoster,
        ...store.subs.map(sub => ({ ...sub, isSub: true }))
      ]

      // If we already saved an order in this draft, sort the combined list to match it
      if (store.kickingOrder && store.kickingOrder.length > 0) {
        combinedPlayers.sort((a, b) => {
          const indexA = store.kickingOrder.indexOf(a.id)
          const indexB = store.kickingOrder.indexOf(b.id)
          // If someone isn't in the saved order (e.g. they just went back to Step 2 and added a new person), put them at the bottom
          const orderA = indexA === -1 ? 999 : indexA
          const orderB = indexB === -1 ? 999 : indexB
          return orderA - orderB
        })
      }

      setPlayers(combinedPlayers)
      setLoading(false)
    }

    fetchPlayers()
  }, [])

  const handleContinue = () => {
    // Map the current visual order to an array of just IDs
    const orderedIds = players.map(p => p.id)
    
    // Save to Zustand auto-persisting store
    store.setKickingOrder(orderedIds)
    store.setCurrentStep(3)

    // Move to the final step: Positions!
    router.push('/games/new/positions')
  }

  if (!mounted) return null
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 w-full pb-24">
      <div className="flex items-center justify-between mb-8">
        <Link href="/games/new/attendance" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Attendance
        </Link>
        <span className="text-sm font-bold text-gray-400">Step 3 of 4</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Kicking Order</h1>
        <p className="text-gray-500 mt-2">Drag and drop players to set your lineup.</p>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        {/* Framer Motion Reorder Group */}
        <Reorder.Group 
          axis="y" 
          values={players} 
          onReorder={setPlayers}
          className="space-y-3"
        >
          {players.map((player, index) => (
            <Reorder.Item 
              key={player.id} 
              value={player}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm cursor-grab active:cursor-grabbing relative z-0 active:z-50 active:shadow-md transition-shadow"
            >
              <div className="text-gray-400">
                <GripVertical className="w-5 h-5" />
              </div>
              
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-extrabold flex items-center justify-center text-sm shrink-0">
                {index + 1}
              </div>
              
              <div className="flex-1 font-bold text-gray-900 flex items-center">
                {player.name}
                {player.isSub && (
                  <span className="ml-2 text-[10px] uppercase bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full inline-flex items-center">
                    <User className="w-3 h-3 mr-0.5" /> Sub
                  </span>
                )}
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      <button
        onClick={handleContinue}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors shadow-sm text-lg"
      >
        Continue to Positions
      </button>
    </div>
  )
}