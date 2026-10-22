'use client'

import { SignOutButton } from '@/components/auth/SignOutButton'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor, Save, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const { fairPlayEnabled, setFairPlayEnabled, inningsCount, setInningsCount } = useSettingsStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleSaveAndRefresh = () => {
    setIsSaving(true)
    
    // Settings are already instantly saved to localStorage by Zustand and next-themes.
    // We add a tiny delay here just so the user sees the satisfying "Saving..." spinner
    // before we hard-refresh the browser to clear the cache and lock it in.
    setTimeout(() => {
      window.location.reload()
    }, 600)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 w-full space-y-6 pb-24">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-8">Settings</h1>
      
      {/* Game Preferences */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Game Preferences</h2>
        
        {mounted && (
          <div className="space-y-4">
            {/* Fair Play Rule */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 gap-4 transition-colors">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Fair Play Rule</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Warn when assigning a player to the bench who has already sat out while others haven't.
                </p>
              </div>
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

            {/* Innings Count */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 gap-4 transition-colors">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Game Length</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Set the default number of innings when creating a new game.
                </p>
              </div>
              <select
                value={inningsCount || 7}
                onChange={(e) => setInningsCount(Number(e.target.value))}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shrink-0 cursor-pointer"
              >
                <option value={5}>5 Innings</option>
                <option value={6}>6 Innings</option>
                <option value={7}>7 Innings</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* App Preferences */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">App Preferences</h2>
        
        {mounted && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 gap-4 transition-colors">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Appearance</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Choose how the app looks on your device.
              </p>
            </div>
            
            <div className="flex p-1 bg-gray-200 dark:bg-gray-950 rounded-lg shrink-0 w-fit transition-colors">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition-all ${
                  theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4" /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition-all ${
                  theme === 'dark' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4" /> Dark
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition-all ${
                  theme === 'system' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" /> System
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Save & Cache Clear */}
      <button
        onClick={handleSaveAndRefresh}
        disabled={isSaving || !mounted}
        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-lg"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Applying Changes...
          </>
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" />
            Save & Refresh Settings
          </>
        )}
      </button>

      {/* Account Settings */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Account</h2>
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700 dark:text-gray-300">Logged in securely</span>
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}