'use client'

import { useState, useEffect } from 'react'
import { Trophy, ArrowRight, Shield, X } from 'lucide-react'
import Link from 'next/link'

export function WelcomeTutorial({ hasTeams }: { hasTeams: boolean }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only show if they have no teams AND haven't dismissed this before on this device
    const hasSeenTutorial = localStorage.getItem('kicksheet_welcome_seen')
    
    if (!hasTeams && !hasSeenTutorial) {
      // Small delay so it pops in smoothly after the dashboard loads
      const timer = setTimeout(() => setShow(true), 600)
      return () => clearTimeout(timer)
    }
  }, [hasTeams])

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('kicksheet_welcome_seen', 'true')
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col items-center text-center relative animate-in zoom-in-95 duration-500 delay-150 fill-mode-both">
        
        {/* Subtle dismiss button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-[#0a192f] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
          <Trophy className="w-10 h-10 text-white" />
        </div>
        
        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
          Welcome to Kicksheet!
        </h3>
        
        <p className="text-sm sm:text-base font-medium text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          Your dashboard is looking a little empty. The first step to managing your roster and generating lineups is creating your team.
        </p>

        <Link 
          href="/teams/new"
          onClick={handleDismiss}
          className="w-full flex items-center justify-center gap-2 bg-[#2563eb] text-white text-base font-bold py-4 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/20 group"
        >
          <Shield className="w-5 h-5" />
          Create My First Team
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        <button 
          onClick={handleDismiss}
          className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          I'll do this later
        </button>
      </div>
    </div>
  )
}