'use client'

import { useState, useEffect } from 'react'
import { Map, X } from 'lucide-react'

export function FieldMapShortcut() {
  // isMounted controls whether the HTML exists on the page
  const [isMounted, setIsMounted] = useState(false)
  // isVisible controls the CSS opacity and scale transitions
  const [isVisible, setIsVisible] = useState(false)

  const openModal = () => {
    setIsMounted(true)
    // A tiny 10ms delay allows the DOM to render before we trigger the CSS transition
    setTimeout(() => setIsVisible(true), 10)
  }

  const closeModal = () => {
    setIsVisible(false)
    // Wait for the 300ms CSS transition to finish before removing from the DOM
    setTimeout(() => setIsMounted(false), 300) 
  }

  // Close modal when pressing the Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMounted) closeModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMounted])

  return (
    <>
      <button 
        onClick={openModal}
        className="group flex items-center justify-center gap-2.5 p-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors w-full h-full"
      >
        <span>Field Map</span>
      </button>

      {isMounted && (
        <div 
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-gray-900/90 dark:bg-black/95 backdrop-blur-md transition-opacity duration-300 ease-out ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeModal}
        >
          <div 
            className={`relative max-w-4xl w-full flex flex-col items-center transition-all duration-300 ease-out transform ${
              isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
            }`} 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Floating Close Button */}
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 sm:-right-4 sm:-top-12 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors active:scale-95"
            >
              <X className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
            
            {/* Full-Width Image */}
            <img 
              src="/assets/kicksheet_positions.png" 
              alt="Kickball Field Positions Diagram" 
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}