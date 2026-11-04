'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, ChevronUp, ChevronDown, Loader2, GripVertical } from 'lucide-react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

function KickingOrderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const supabase = createClient()

  const [orderedPlayers, setOrderedPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return 
    if (result.destination.index === result.source.index) return 

    const newOrder = Array.from(orderedPlayers)
    const [reorderedItem] = newOrder.splice(result.source.index, 1)
    newOrder.splice(result.destination.index, 0, reorderedItem)

    setOrderedPlayers(newOrder)
  }

  const handleNext = async () => {
    setSaving(true)
    const finalOrderIds = orderedPlayers.map(p => p.id)
    await supabase.from('games').update({ kicking_order: finalOrderIds }).eq('id', id)
    router.push(`/games/new/positions?id=${id}`)
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
      <div className="max-w-2xl mx-auto p-4 w-full pt-8 sm:pt-24 pb-48">
        
        <div className="mb-8 text-center">
          <h2 className="text-xs font-black text-[#2563eb] dark:text-blue-400 uppercase tracking-widest mb-2">Step 2 of 3</h2>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">Kicking Order</h1>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-300 dark:border-gray-700 p-3 sm:p-5 mb-6 shadow-xl shadow-blue-900/5 dark:shadow-none transition-colors">
          
          {/* Standardized Section Header */}
          <div className="w-full bg-gray-300/60 dark:bg-black/40 border border-blue-400/40 dark:border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between mb-4">
            <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
              Lineup
            </h2>
            <span className="text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-md">
              {orderedPlayers.length} Kickers
            </span>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="kicking-order-list">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {orderedPlayers.map((player, idx) => (
                    <Draggable key={player.id} draggableId={player.id} index={idx}>
                      {(provided, snapshot) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={provided.draggableProps.style}
                          className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all duration-200 ${
                            snapshot.isDragging 
                              ? 'border-[#2563eb] shadow-2xl bg-blue-50/90 dark:bg-[#0a192f] scale-[1.02] z-50' 
                              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            {/* Touch-friendly Drag Handle */}
                            <div 
                              {...provided.dragHandleProps}
                              className="text-gray-400 dark:text-gray-500 cursor-grab active:cursor-grabbing p-1 -ml-1 touch-none hover:text-[#2563eb] transition-colors"
                            >
                              <GripVertical className="w-6 h-6" />
                            </div>
                            
                            <div className={`w-8 h-8 font-black rounded-lg flex items-center justify-center text-sm transition-colors shadow-sm border ${
                              snapshot.isDragging 
                                ? 'bg-[#2563eb] text-white border-[#2563eb]' 
                                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600'
                            }`}>
                              {idx + 1}
                            </div>
                            <span className={`font-bold text-lg tracking-tight truncate max-w-[120px] sm:max-w-[200px] ${
                              snapshot.isDragging ? 'text-[#2563eb] dark:text-blue-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              {player.name}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                            <button 
                              onClick={() => moveUp(idx)}
                              disabled={idx === 0}
                              className="p-2 text-gray-400 dark:text-gray-500 hover:text-[#2563eb] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl disabled:opacity-20 transition-colors cursor-pointer active:scale-95"
                            >
                              <ChevronUp className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => moveDown(idx)}
                              disabled={idx === orderedPlayers.length - 1}
                              className="p-2 text-gray-400 dark:text-gray-500 hover:text-[#2563eb] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl disabled:opacity-20 transition-colors cursor-pointer active:scale-95"
                            >
                              <ChevronDown className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Sticky Footer Bar */}
      <div className="fixed bottom-0 z-[100] left-0 right-0 p-4 pb-8 sm:pb-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-t border-gray-300 dark:border-gray-800 transition-colors">
        <div className="max-w-2xl mx-auto flex justify-between">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center px-6 py-3.5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors active:scale-95"
          >
            Back
          </button>
          <button 
            onClick={handleNext}
            disabled={saving}
            className="inline-flex items-center px-6 py-3.5 bg-[#2563eb] hover:bg-blue-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-blue-900/20"
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
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    }>
      <KickingOrderContent />
    </Suspense>
  )
}