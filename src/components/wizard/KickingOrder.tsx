'use client'

import { useEffect } from 'react'
import { useDraftStore } from '@/store/useDraftStore'
import { Player } from '@/types/models'
import { GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortablePlayerItemProps {
  id: string
  player: Player
  index: number
}

function SortablePlayerItem({ id, player, index }: SortablePlayerItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-3 bg-white border rounded-lg shadow-sm ${
        isDragging ? 'border-blue-500 shadow-md opacity-90' : 'border-gray-200'
      }`}
    >
      <div 
        {...attributes} 
        {...listeners}
        className="p-2 -ml-2 text-gray-400 hover:text-gray-600 touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="font-bold text-gray-400 w-6 text-right">{index + 1}.</div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900">{player.name}</p>
        {player.number && <p className="text-xs text-gray-500">#{player.number}</p>}
      </div>
    </div>
  )
}

export default function KickingOrder({ roster }: { roster: Player[] }) {
  const { draft, setKickingOrder } = useDraftStore()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Initialize kicking order with attending players if empty or mismatched
  useEffect(() => {
    const currentOrder = draft.kickingOrder
    const attending = draft.attendingPlayers

    const missingPlayers = attending.filter(id => !currentOrder.includes(id))
    const validCurrentOrder = currentOrder.filter(id => attending.includes(id))

    if (missingPlayers.length > 0 || validCurrentOrder.length !== currentOrder.length) {
      setKickingOrder([...validCurrentOrder, ...missingPlayers])
    }
  }, [draft.attendingPlayers, draft.kickingOrder, setKickingOrder])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = draft.kickingOrder.indexOf(active.id as string)
      const newIndex = draft.kickingOrder.indexOf(over.id as string)
      setKickingOrder(arrayMove(draft.kickingOrder, oldIndex, newIndex))
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Kicking Order</h2>
        <p className="text-gray-500 text-sm mt-1">Drag and drop to set your lineup.</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={draft.kickingOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {draft.kickingOrder.map((playerId, index) => {
              const player = roster.find(p => p.id === playerId)
              if (!player) return null
              return (
                <SortablePlayerItem 
                  key={playerId} 
                  id={playerId} 
                  player={player} 
                  index={index} 
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}