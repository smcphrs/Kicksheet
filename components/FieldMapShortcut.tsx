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
        <span>Field Map</span>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-gray-900/90 dark:bg-black/95 backdrop-blur-md"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="relative max-w-4xl w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute -top-12 right-0 sm:-right-4 sm:-top-12 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors active:scale-95"
            >
              <X className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            
            {/* Full-Width Image without the white box padding */}
            <img 
              src="/assets/kicksheet_positions.png" 
              alt="Kickball Field Positions Diagram" 
              className="w-full h-auto max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  )
}