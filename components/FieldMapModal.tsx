'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
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

  // Ensure we are strictly on the client before using portals
  if (!isMounted || typeof document === 'undefined') return null

  // Teleport the modal directly to the body tag
  return createPortal(
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/95 dark:bg-black/95 backdrop-blur-xl transition-opacity duration-300 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className={`fixed top-4 right-4 sm:top-8 sm:right-8 p-2 sm:p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-300 z-50 backdrop-blur-sm shadow-lg ${
           isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <X className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>

      <div 
        className={`relative w-full h-full max-w-7xl flex items-center justify-center p-2 sm:p-12 transition-transform duration-300 ease-out transform ${
          isVisible ? 'scale-100' : 'scale-95'
        }`} 
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src="/assets/kicksheet_positions.png" 
          alt="Kickball Field Positions Diagram" 
          className="max-w-full max-h-full object-contain drop-shadow-2xl"
        />
      </div>
    </div>,
    document.body
  )
}