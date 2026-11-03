'use client'

import { SignOutButton } from '@/components/auth/SignOutButton'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Moon, Sun, Monitor, Save, Loader2, ArrowLeft, Shield, Paintbrush, Cog, KeyRound, CheckCircle2, AlertCircle, Mail } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { fairPlayEnabled, setFairPlayEnabled, inningsCount, setInningsCount } = useSettingsStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Global Save States
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // User State
  const [currentEmail, setCurrentEmail] = useState('')

  // Email Update States
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState(false)

  // Password Update States
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    setMounted(true)
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setCurrentEmail(user.email)
    }
    fetchUser()
  }, [])

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

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    setEmailSuccess(false)

    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Please enter a valid email address.')
      return
    }

    if (newEmail === currentEmail) {
      setEmailError('Please enter a different email address.')
      return
    }

    setIsUpdatingEmail(true)
    const supabase = createClient()
    
    const { error } = await supabase.auth.updateUser({ email: newEmail })

    if (error) {
      setEmailError(error.message)
    } else {
      setEmailSuccess(true)
      setNewEmail('')
      setTimeout(() => {
        setIsEditingEmail(false)
        setEmailSuccess(false)
      }, 6000) // Keep message up longer so they can read the instruction
    }
    setIsUpdatingEmail(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setIsUpdatingPassword(true)
    const supabase = createClient()
    
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setPasswordError(error.message)
    } else {
      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setIsEditingPassword(false)
        setPasswordSuccess(false)
      }, 3000)
    }
    setIsUpdatingPassword(false)
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
              
              {/* Session / Sign Out */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 sm:pb-8 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Active Session</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">You are currently logged in securely to Kicksheet.</p>
                </div>
                
                <div className="w-full sm:w-auto">
                  <SignOutButton />
                </div>
              </div>

              {/* Email Update Area */}
              <div className="pt-6 sm:pt-8 pb-6 sm:pb-8 border-b border-gray-100 dark:border-gray-800">
                {!isEditingEmail ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Email Address</h3>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                        {currentEmail ? currentEmail : 'Loading...'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsEditingEmail(true)
                        setNewEmail(currentEmail)
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors border border-gray-300 dark:border-gray-700 active:scale-95"
                    >
                      <Mail className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                      Update Email
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Update Email Address
                      </h3>
                    </div>
                    
                    {emailError && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {emailError}
                      </div>
                    )}

                    {emailSuccess ? (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-xl text-green-700 dark:text-green-400 flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Confirmation links sent!</p>
                          <p className="text-sm font-medium mt-1 opacity-90 leading-relaxed">
                            For security, you must click the verification links sent to <strong>both</strong> your old and new email addresses to complete this change.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleUpdateEmail} className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">New Email Address</label>
                          <input
                            type="email"
                            required
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-gray-400 font-medium"
                            placeholder="Enter new email address"
                          />
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingEmail(false)
                              setEmailError(null)
                            }}
                            className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold rounded-xl transition-colors border border-gray-300 dark:border-gray-700 active:scale-95"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isUpdatingEmail || !newEmail || newEmail === currentEmail}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                          >
                            {isUpdatingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Email'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

              {/* Password Update Area */}
              <div className="pt-6 sm:pt-8">
                {!isEditingPassword ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Password</h3>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">Update your account password.</p>
                    </div>
                    <button
                      onClick={() => setIsEditingPassword(true)}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors border border-gray-300 dark:border-gray-700 active:scale-95"
                    >
                      <KeyRound className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                      Update Password
                    </button>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                        <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Update Password
                      </h3>
                    </div>
                    
                    {passwordError && (
                      <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        {passwordError}
                      </div>
                    )}

                    {passwordSuccess ? (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 rounded-xl text-green-700 dark:text-green-400 font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        Password updated successfully!
                      </div>
                    ) : (
                      <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-gray-400 font-medium"
                            placeholder="Enter new password (min 6 characters)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                          <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all placeholder:text-gray-400 font-medium"
                            placeholder="Confirm new password"
                          />
                        </div>
                        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingPassword(false)
                              setPasswordError(null)
                              setNewPassword('')
                              setConfirmPassword('')
                            }}
                            className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold rounded-xl transition-colors border border-gray-300 dark:border-gray-700 active:scale-95"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isUpdatingPassword || !newPassword || !confirmPassword}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                          >
                            {isUpdatingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Password'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}