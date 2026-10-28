'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, ArrowRight, Check, Loader2 } from 'lucide-react'

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

      const { data: roster } = await supabase.from('players').select('*').eq('team_id', game.team_id).order('name')
      
      if (roster) {
        setPlayers(roster)
        // If we already saved attendance, use it. Otherwise, select everyone by default.
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

  const handleNext = async () => {
    setSaving(true)
    // Save the attendance to the kicking_order array temporarily
    await supabase.from('games').update({ kicking_order: selectedIds }).eq('id', id)
    // Send them to the next step
    router.push(`/games/new/kicking-order?id=${id}`)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-gray-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 w-full pb-32">
      <div className="mb-8 text-center">
        <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">Step 1 of 3</h2>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Attendance</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium mt-2">Who is playing today?</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-2 sm:p-4 mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 mb-2">
          <span className="font-bold text-gray-700 dark:text-gray-300">Roster</span>
          <span className="text-sm font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 px-3 py-1 rounded-full">
            {selectedIds.length} Selected
          </span>
        </div>
        
        <div className="space-y-1">
          {players.map(player => {
            const isSelected = selectedIds.includes(player.id)
            return (
              <button
                key={player.id}
                onClick={() => togglePlayer(player.id)}
                className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                  isSelected 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent'
                } border`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                  <span className={`font-bold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                    {player.name}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto flex justify-end">
          <button 
            onClick={handleNext}
            disabled={saving || selectedIds.length === 0}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <AttendanceContent />
    </Suspense>
  )
}