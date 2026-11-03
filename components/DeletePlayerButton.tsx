'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function DeletePlayerButton({ playerId, playerName }: { playerId: string, playerName: string }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove ${playerName} from the roster?`)) return

    setIsDeleting(true)
    const { error } = await supabase.from('players').delete().eq('id', playerId)
    
    if (error) {
      alert('Failed to delete player. They may be tied to an existing game lineup.')
      setIsDeleting(false)
    } else {
      router.refresh() // Refreshes the server component to instantly remove the player from the list
    }
  }

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 sm:p-2.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Delete Player"
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
      )}
    </button>
  )
}