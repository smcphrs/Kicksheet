'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Medal, RotateCcw, Loader2, AlertCircle } from 'lucide-react'

export function RecordStatCard({ wins, losses, ties }: { wins: number, losses: number, ties: number }) {
  const supabase = createClient()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleReset = async () => {
    setResetting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Clears the W/L/T result from all games without deleting the games themselves
      await supabase.from('games').update({ result: null }).eq('user_id', user.id)
      router.refresh()
    }
    setConfirming(false)
    setResetting(false)
  }

  return (
    <>
      <div className="group relative bg-[#673ab7] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#673ab7] flex flex-col justify-between transition-all overflow-hidden h-full">
        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-white opacity-10 rounded-full blur-2xl pointer-events-none transition-transform duration-500"></div>
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm transition-all duration-300">
              <Medal className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-purple-100 uppercase tracking-widest">W-L-T</h3>
          </div>
          <button 
            onClick={() => setConfirming(true)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/10 active:scale-95"
            title="Reset Season Record"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        
        <p className="text-3xl sm:text-4xl font-black text-white tracking-tight relative z-10">
          {wins}-{losses}-{ties}
        </p>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-gray-300 dark:border-gray-700 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-5 border border-amber-200 dark:border-amber-900/50">
              <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Reset Season?</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
              Are you sure you want to reset your record to <strong>0-0-0</strong>? This will clear the Win/Loss/Tie results from all of your past games.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirming(false)}
                disabled={resetting}
                className="flex-1 py-3 px-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors border border-gray-300 dark:border-gray-700 disabled:opacity-50 active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 active:scale-95"
              >
                {resetting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}