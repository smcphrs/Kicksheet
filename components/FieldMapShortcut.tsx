'use client'

import { useState } from 'react'
import { Map, X } from 'lucide-react'

export function FieldMapShortcut() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="group flex items-center justify-center gap-2.5 p-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors w-full h-full"
      >
        {/* The Map icon was missing right here! */}
        <span>Field Map</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-6 max-w-2xl w-full border border-gray-300 dark:border-gray-800 relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 pr-10 tracking-tight">Field Positions</h2>
            
            <div className="rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-2">
              <img 
                src="/assets/kicksheet_positions.png" 
                alt="Kickball Field Positions Diagram" 
                className="w-full h-auto rounded-xl"
              />
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors active:scale-95"
            >
              Close Map
            </button>
          </div>
        </div>
      )}
    </>
  )
}