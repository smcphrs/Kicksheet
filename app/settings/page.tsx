'use client'

import { SignOutButton } from '@/components/auth/SignOutButton'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor, Save, Loader2, ArrowLeft, Shield, Paintbrush, Cog, LogOut, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { fairPlayEnabled, setFairPlayEnabled, inningsCount, setInningsCount } = useSettingsStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => setMounted(true), [])

  const handleSaveAndRefresh = () => {
    setIsSaving(true)
    
    setTimeout(() => {
      setIsSaving(false)
      setSaveSuccess(true)
      
      setTimeout(() => {
        window.location.reload()
      }, 400)
    }, 600)
  }

  if (!mounted) return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center transition-colors">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-24 sm:px-6 sm:pt-24 w-full space-y-8 sm:space-y-10">
        
        <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>

        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              Settings
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium text-lg tracking-tight">Manage your account and application preferences.</p>
          </div>
        </header>

        <div className="space-y-6 sm:space-y-8">
          
          {/* Game Preferences */}
          <section>
            <div className="w-full bg-gray-200/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 flex items-center mb-4">
              <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                <Cog className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Game Engine
              </h2>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-300 dark:border-gray-700 transition-colors">
              <div className="space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 gap-4 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">Fair Play Enforcement</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed pr-4">
                      When active, the lineup builder will visually warn you if you assign a player to the bench who has already sat out, while other players have not yet sat out.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={fairPlayEnabled}
                      onChange={(e) => setFairPlayEnabled(e.target.checked)}
                    />
                    <div className="w-14 h-7 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#2563eb]"></div>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 gap-4 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">Default Game Length</h3>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed pr-4">
                      Sets the initial number of innings when creating a brand new game lineup. You can always change this per-game later.
                    </p>
                  </div>
                  <select
                    value={inningsCount || 7}
                    onChange={(e) => setInningsCount(Number(e.target.value))}
                    className="px-5 py-3 rounded-xl border border-gray-300 dark:border-gray-600 font-extrabold text-gray-900 dark:text-white bg-white dark:bg-gray-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all shrink-0 cursor-pointer shadow-sm"
                  >
                    <option value={5}>5 Innings</option>
                    <option value={6}>6 Innings</option>
                    <option value={7}>7 Innings</option>
                    <option value={8}>8 Innings</option>
                    <option value={9}>9 Innings</option>
                  </select>
                </div>

              </div>
            </div>
          </section>

          {/* App Preferences */}
          <section>
            <div className="w-full bg-gray-200/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 flex items-center mb-4">
              <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                <Paintbrush className="w-4 h-4 text-orange-500" /> Interface
              </h2>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-300 dark:border-gray-700 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 gap-4 transition-colors">
                <div>
                  <h3 className="font-extrabold text-gray-900 dark:text-white text-lg">Theme Appearance</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1.5">
                    Choose how the application looks on your device.
                  </p>
                </div>
                
                <div className="flex p-1.5 bg-gray-200 dark:bg-gray-950 rounded-xl shrink-0 w-full sm:w-auto overflow-hidden transition-colors border border-gray-300 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                      theme === 'light' ? 'bg-white text-gray-900 shadow-sm border border-gray-300' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-transparent'
                    }`}
                  >
                    <Sun className="w-4 h-4" /> Light
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                      theme === 'dark' ? 'bg-gray-800 text-white shadow-sm border border-gray-700' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-transparent'
                    }`}
                  >
                    <Moon className="w-4 h-4" /> Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                      theme === 'system' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-300 dark:border-gray-700' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-transparent'
                    }`}
                  >
                    <Monitor className="w-4 h-4" /> Auto
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Manual Save & Cache Clear */}
          <button
            onClick={handleSaveAndRefresh}
            disabled={isSaving || saveSuccess}
            className={`w-full py-4 font-bold rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed text-lg border ${
              saveSuccess 
                ? 'bg-green-600 text-white border-green-700' 
                : 'bg-[#2563eb] hover:bg-blue-700 text-white border-blue-700'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Applying Settings...
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Settings Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save & Apply Changes
              </>
            )}
          </button>

          {/* Account Settings */}
          <section>
            <div className="w-full bg-gray-200/50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2.5 flex items-center mb-4 mt-8">
              <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600 dark:text-green-400" /> Account Security
              </h2>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-300 dark:border-gray-700 transition-colors">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Active Session</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">You are currently logged in securely to Kicksheet.</p>
                </div>
                
                <div className="w-full sm:w-auto">
                  <SignOutButton />
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}