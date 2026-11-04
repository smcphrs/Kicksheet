'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserPlus, Check, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function WriteInSubForm({ gameId }: { gameId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAddSub = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)

    // 1. Create a "temporary" player unlinked from the team roster (team_id: null)
    const { data: subPlayer, error: playerError } = await supabase
      .from('players')
      .insert({ 
        name: `${name.trim()} (Sub)`,
        team_id: null // Prevents them from showing up on the Manage Teams roster
      })
      .select()
      .single()

    if (playerError) {
      alert('Failed to create sub. (Ensure team_id allows NULL in your Supabase table!)')
      setLoading(false)
      return
    }

    // 2. Add them to this specific game's attendance as 'IN'
    // Note: Change 'attendance' to match your actual table name if it's different!
    const { error: attendanceError } = await supabase
      .from('attendance') 
      .insert({
        game_id: gameId,
        player_id: subPlayer.id,
        status: 'IN' // Or however you track 'attending' status
      })

    if (attendanceError) {
      alert('Failed to add sub to game attendance.')
    } else {
      setName('')
      setIsOpen(false)
      router.refresh() // Refreshes the server page to instantly show the new sub in the list!
    }
    
    setLoading(false)
  }

  return (
    <div className="mt-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-4 bg-gray-50/50 dark:bg-gray-800/20 transition-colors">
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-full py-2 text-sm font-bold text-[#2563eb] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors active:scale-95 group"
        >
          <UserPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> 
          Add Write-in Sub
        </button>
      ) : (
        <form onSubmit={handleAddSub} className="flex flex-col sm:flex-row items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
          <input
            autoFocus
            type="text"
            placeholder="Sub's full name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full flex-1 p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#2563eb] outline-none text-gray-900 dark:text-white placeholder-gray-400 font-medium text-sm"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="flex-1 sm:flex-none p-3 flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-xl transition-colors active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 sm:flex-none p-3 flex items-center justify-center bg-[#43a047] hover:bg-green-700 text-white rounded-xl transition-colors active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}