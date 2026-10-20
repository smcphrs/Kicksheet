'use client'

import { SignOutButton } from '@/components/auth/SignOutButton'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const { fairPlayEnabled, setFairPlayEnabled } = useSettingsStore()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration errors by waiting for the client to load the saved settings
  useEffect(() => setMounted(true), [])

  return (
    <div className="max-w-3xl mx-auto p-6 w-full space-y-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">Settings</h1>
      
      {/* Game Preferences */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Game Preferences</h2>
        
        {mounted && (
          <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200">
            <div className="pr-4">
              <h3 className="font-bold text-gray-900">Fair Play Rule</h3>
              <p className="text-sm text-gray-500 mt-1">
                Show a warning during lineup creation if you assign a player to the bench who has already sat out while others haven't.
              </p>
            </div>
            
            {/* iOS-style Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={fairPlayEnabled}
                onChange={(e) => setFairPlayEnabled(e.target.checked)}
              />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
            </label>
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Account</h2>
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">Logged in securely</span>
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}