'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface FieldMapModalProps {
  isOpen: boolean
  onClose: () => void
}

export function FieldMapModal({ isOpen, onClose }: FieldMapModalProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true)
      setTimeout(() => setIsVisible(true), 10)
    } else {
      setIsVisible(false)
      const timer = setTimeout(() => setIsMounted(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isMounted) return null

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/95 dark:bg-black backdrop-blur-xl transition-opacity duration-300 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div 
        className={`relative w-full h-[100dvh] flex flex-col items-center justify-center transition-all duration-300 ease-out transform ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors active:scale-95 z-50 backdrop-blur-sm shadow-lg"
        >
          <X className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
        
        <img 
          src="/assets/kicksheet_positions.png" 
          alt="Kickball Field Positions Diagram" 
          className="w-full h-full object-contain p-2 sm:p-8"
        />
      </div>
    </div>
  )
}