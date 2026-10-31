'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, ChevronUp, ChevronDown, Loader2, GripVertical } from 'lucide-react'

function KickingOrderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const supabase = createClient()

  const [orderedPlayers, setOrderedPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Native Drag & Drop State
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    async function fetchOrder() {
      const { data: game } = await supabase.from('games').select('team_id, kicking_order').eq('id', id).single()
      if (!game || !game.kicking_order) return

      const { data: roster } = await supabase.from('players').select('id, name').in('id', game.kicking_order)
      
      if (roster) {
        const hydrated = game.kicking_order.map((pid: string) => roster.find((p: any) => p.id === pid)).filter(Boolean)
        setOrderedPlayers(hydrated)
      }
      setLoading(false)
    }
    fetchOrder()
  }, [id, supabase])

  // --- BUTTON CONTROLS (For Mobile Fallback) ---
  const moveUp = (index: number) => {
    if (index === 0) return
    const newOrder = [...orderedPlayers]
    const temp = newOrder[index - 1]
    newOrder[index - 1] = newOrder[index]
    newOrder[index] = temp
    setOrderedPlayers(newOrder)
  }

  const moveDown = (index: number) => {
    if (index === orderedPlayers.length - 1) return
    const newOrder = [...orderedPlayers]
    const temp = newOrder[index + 1]
    newOrder[index + 1] = newOrder[index]
    newOrder[index] = temp
    setOrderedPlayers(newOrder)
  }

  // --- DRAG AND DROP CONTROLS (For Desktop/Pointer) ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIdx(index)
    // Required for Firefox compatibility
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault()
    if (draggedIdx === null) return
    if (index !== draggedIdx) {
      const newOrder = [...orderedPlayers]
      const draggedItem = newOrder[draggedIdx]
      newOrder.splice(draggedIdx, 1)
      newOrder.splice(index, 0, draggedItem)
      setDraggedIdx(index)
      setOrderedPlayers(newOrder)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault() // Necessary to allow dropping
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
  }

  const handleNext = async () => {
    setSaving(true)
    const finalOrderIds = orderedPlayers.map(p => p.id)
    await supabase.from('games').update({ kicking_order: finalOrderIds }).eq('id', id)
    
    router.push(`/games/new/positions?id=${id}`)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-gray-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 w-full pb-32">
      <div className="mb-8 text-center">
        <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">Step 2 of 3</h2>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Kicking Order</h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium mt-2">Adjust the lineup sequence</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-2 sm:p-4 mb-6">
        <div className="space-y-2">
          {orderedPlayers.map((player, idx) => {
            const isDragging = draggedIdx === idx

            return (
              <div 
                key={player.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragEnter={(e) => handleDragEnter(e, idx)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                className={`flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border transition-all duration-200 ${
                  isDragging 
                    ? 'opacity-50 border-blue-500 scale-[0.98] shadow-inner bg-blue-50/50 dark:bg-blue-900/20' 
                    : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 cursor-grab active:cursor-grabbing'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Drag Handle Icon */}
                  <div className="text-gray-400 dark:text-gray-500 hidden sm:flex cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  
                  <div className={`w-8 h-8 font-bold rounded-lg flex items-center justify-center text-sm transition-colors ${
                    isDragging ? 'bg-blue-600 text-white' : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{player.name}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                  <button 
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg disabled:opacity-20 transition-colors cursor-pointer"
                  >
                    <ChevronUp className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => moveDown(idx)}
                    disabled={idx === orderedPlayers.length - 1}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg disabled:opacity-20 transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="fixed bottom-15 sm:bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-40">
        <div className="max-w-2xl mx-auto flex justify-between">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
          <button 
            onClick={handleNext}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Set Positions'}
            {!saving && <ArrowRight className="w-5 h-5 ml-2" />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function KickingOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <KickingOrderContent />
    </Suspense>
  )
}