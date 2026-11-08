'use client'

import { useState } from 'react'
import { Map, DiagramFlowHorizontal } from 'lucide-react'
import { FieldMapModal } from './FieldMapModal'


export function FieldMapShortcut() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="group flex items-center justify-center gap-2.5 p-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors w-full h-full"
      >
        <DiagramFlowHorizontal className="w-4 h-4 text-green-500" />
        <span>Field Map</span>
      </button>

      <FieldMapModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}