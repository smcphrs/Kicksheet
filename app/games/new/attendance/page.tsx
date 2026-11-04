'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, ArrowRight, Check, Loader2 } from 'lucide-react'
import { WriteInSubForm } from '@/components/WriteInSubForm'

function AttendanceContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const supabase = createClient()

  const [players, setPlayers] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    async function fetchPlayers() {
      const { data: game } = await supabase.from('games').select('team_id, kicking_order').eq('id', id).single()
      if (!game) return

      // Fetch roster OR anyone already saved to this game's kicking order (which will include our subs!)
      let query = supabase.from('players').select('*')
      if (game.kicking_order && game.kicking_order.length > 0) {
        query = query.or(`team_id.eq.${game.team_id},id.in.(${game.kicking_order.join(',')})`)
      } else {
        query = query.eq('team_id', game.team_id)
      }
      
      const { data: roster } = await query.order('name')
      
      if (roster) {
        setPlayers(roster)
        if (game.kicking_order && game.kicking_order.length > 0) {
          setSelectedIds(game.kicking_order)
        } else {
          setSelectedIds(roster.map(p => p.id))
        }
      }
      setLoading(false)
    }
    fetchPlayers()
  }, [id, supabase])

  const togglePlayer = (playerId: string) => {
    setSelectedIds(prev => 
      prev.includes(playerId) 
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  // This catches the new sub from the form and instantly updates the UI
  const handleSubAdded = (newPlayer: any) => {
    setPlayers(prev => [...prev, newPlayer]) // Add them to the visual list
    setSelectedIds(prev => [...prev, newPlayer.id]) // Auto-select them
  }

  const handleNext = async () => {
    setSaving(true)
    await supabase.from('games').update({ kicking_order: selectedIds }).eq('id', id)
    router.push(`/games/new/kicking-order?id=${id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto p-4 w-full pt-8 sm:pt-24 pb-32">
        <div className="mb-8 text-center">
          <h2 className="text-xs font-black text-[#2563eb] dark:text-blue-400 uppercase tracking-widest mb-2">Step 1 of 3</h2>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">Attendance</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 text-lg">Who will play in this game?</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-300 dark:border-gray-700 p-3 sm:p-5 mb-6 shadow-xl shadow-blue-900/5 dark:shadow-none transition-colors">
          
          {/* Standardized Section Header */}
          <div className="w-full bg-gray-300/60 dark:bg-black/40 border border-blue-400/40 dark:border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between mb-4">
            <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
              Roster
            </h2>
            <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-md">
              {selectedIds.length} Selected
            </span>
          </div>
          
          <div className="space-y-2">
            {players.map(player => {
              const isSelected = selectedIds.includes(player.id)
              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98] ${
                    isSelected 
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-[#2563eb]/30 dark:border-blue-500/30 shadow-sm' 
                      : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700/50'
                  } border`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors shadow-sm ${
                      isSelected ? 'bg-[#2563eb] text-white' : 'bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    }`}>
                      {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                    </div>
                    <span className={`font-bold text-lg tracking-tight ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                      {player.name}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
          
          {/* Write In Sub Form */}
          {id && <WriteInSubForm gameId={id} onSuccess={handleSubAdded} />}
        </div>

      </div>
      
      {/* Sticky Footer Bar */}
      <div className="fixed bottom-0 z-40 left-0 right-0 p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-t border-gray-300 dark:border-gray-800 transition-colors">
        <div className="max-w-2xl mx-auto flex justify-end">
          <button 
            onClick={handleNext}
            disabled={saving || selectedIds.length === 0}
            className="inline-flex items-center px-6 py-3.5 bg-[#2563eb] hover:bg-blue-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-blue-900/20"
          >
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Continue to Kicking Order'}
            {!saving && <ArrowRight className="w-5 h-5 ml-2" />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AttendancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    }>
      <AttendanceContent />
    </Suspense>
  )
}