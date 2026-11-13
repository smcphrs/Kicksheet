'use client'

import { SignOutButton } from '@/components/auth/SignOutButton'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Moon, Sun, Monitor, Loader2, ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Mail, HelpCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

// --- iOS Style Tooltip Component (Mobile & Desktop Friendly) ---
const SettingsTooltip = ({ text }: { text: string }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div 
      className="relative flex items-center justify-center ml-2 cursor-pointer"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
      
      <div 
        className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded-lg transition-all duration-200 z-50 text-center shadow-xl pointer-events-none ${
          isOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-1'
        }`}
      >
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { 
    fairPlayEnabled, setFairPlayEnabled, 
    inningsCount, setInningsCount, 
    askForJerseyNumbers, setAskForJerseyNumbers, 
    showPronouns, setShowPronouns 
  } = useSettingsStore()
  
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // User State
  const [currentEmail, setCurrentEmail] = useState('')

  // Form States
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState(false)

  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Fetch User
  useEffect(() => {
    setMounted(true)
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setCurrentEmail(user.email)
    }
    fetchUser()
  }, [])

  // Sync Settings to Database
  useEffect(() => {
    if (!mounted) return
    const saveSettingsToDb = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { error } = await supabase
        .from('teams')
        .update({ track_jersey_numbers: askForJerseyNumbers })
        .eq('owner_id', user.id)
      if (error) console.error("Failed to save setting to database:", error)
    }
    const delaySave = setTimeout(() => saveSettingsToDb(), 500)
    return () => clearTimeout(delaySave)
  }, [askForJerseyNumbers, showPronouns, inningsCount, fairPlayEnabled, mounted])

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    setEmailSuccess(false)
    if (!newEmail || !newEmail.includes('@') || newEmail === currentEmail) {
      setEmailError('Please enter a valid, different email address.')
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
      setTimeout(() => { setIsEditingEmail(false); setEmailSuccess(false) }, 6000)
    }
    setIsUpdatingEmail(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)
    if (newPassword.length < 6 || newPassword !== confirmPassword) {
      setPasswordError('Passwords must match and be at least 6 characters.')
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
      setTimeout(() => { setIsEditingPassword(false); setPasswordSuccess(false) }, 3000)
    }
    setIsUpdatingPassword(false)
  }

  if (!mounted) return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f2f2f7] dark:bg-black transition-colors font-sans pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 w-full space-y-8">
        
        <header>
          <Link href="/dashboard" className="inline-flex items-center text-[15px] text-blue-600 hover:text-blue-700 transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
        </header>

        {/* GAME ENGINE */}
        <section>
          <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-4 mb-2">Game Engine</h2>
          <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            
            {/* Row 1 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center">
                <span className="text-[17px] text-gray-900 dark:text-white">Fair Play Enforcement</span>
                <SettingsTooltip text="Visually warns you if a player is benched back-to-back while others haven't sat out." />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={fairPlayEnabled} onChange={(e) => setFairPlayEnabled(e.target.checked)} />
                <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#34c759] border border-gray-200 dark:border-gray-700/50"></div>
              </label>
            </div>

            {/* Row 2 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center">
                <span className="text-[17px] text-gray-900 dark:text-white">Default Game Length</span>
                <SettingsTooltip text="Sets the initial number of innings when generating a brand new game lineup." />
              </div>
              <select
                value={inningsCount || 7}
                onChange={(e) => setInningsCount(Number(e.target.value))}
                className="text-[17px] text-gray-500 dark:text-gray-400 bg-transparent outline-none cursor-pointer text-right appearance-none"
                style={{ WebkitAppearance: 'none' }}
              >
                <option value={5}>5 Innings</option>
                <option value={6}>6 Innings</option>
                <option value={7}>7 Innings</option>
                <option value={8}>8 Innings</option>
                <option value={9}>9 Innings</option>
              </select>
            </div>

            {/* Row 3 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center">
                <span className="text-[17px] text-gray-900 dark:text-white">Use Jersey Numbers</span>
                <SettingsTooltip text="Asks for jersey numbers during signup and displays them on the roster." />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={askForJerseyNumbers} onChange={(e) => setAskForJerseyNumbers(e.target.checked)} />
                <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#34c759] border border-gray-200 dark:border-gray-700/50"></div>
              </label>
            </div>

            {/* Row 4 */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                <span className="text-[17px] text-gray-900 dark:text-white">Display Pronouns</span>
                <SettingsTooltip text="Subtly displays player pronouns (if provided) on team cards." />
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={showPronouns} onChange={(e) => setShowPronouns(e.target.checked)} />
                <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#34c759] border border-gray-200 dark:border-gray-700/50"></div>
              </label>
            </div>
          </div>
        </section>

        {/* APPEARANCE */}
        <section>
          <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-4 mb-2">Appearance</h2>
          <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[17px] text-gray-900 dark:text-white w-full sm:w-auto">Theme</span>
            
            {/* iOS Segmented Control */}
            <div className="flex p-1 bg-gray-100 dark:bg-[#2c2c2e] rounded-lg w-full sm:w-auto shrink-0">
              <button onClick={() => setTheme('light')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${theme === 'light' ? 'bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}>
                <Sun className="w-3.5 h-3.5" /> Light
              </button>
              <button onClick={() => setTheme('dark')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${theme === 'dark' ? 'bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}>
                <Moon className="w-3.5 h-3.5" /> Dark
              </button>
              <button onClick={() => setTheme('system')} className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md text-[13px] font-medium transition-all ${theme === 'system' ? 'bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}>
                <Monitor className="w-3.5 h-3.5" /> Auto
              </button>
            </div>
          </div>
        </section>

        {/* ACCOUNT */}
        <section>
          <h2 className="text-[13px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-4 mb-2">Account</h2>
          <div className="bg-white dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
            
            {/* Email Row */}
            <div className="border-b border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => { setIsEditingEmail(!isEditingEmail); setNewEmail(currentEmail) }}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#1c1c1e] hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors"
              >
                <span className="text-[17px] text-gray-900 dark:text-white flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" /> Email
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[17px] text-gray-500 dark:text-gray-400 truncate max-w-[150px] sm:max-w-xs">{currentEmail}</span>
                  <ChevronRight className={`w-5 h-5 text-gray-300 dark:text-gray-600 transition-transform ${isEditingEmail ? 'rotate-90' : ''}`} />
                </div>
              </button>
              
              {/* Email Edit Panel */}
              {isEditingEmail && (
                <div className="p-4 bg-gray-50 dark:bg-[#151515] border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 fade-in duration-200">
                  {emailError && <div className="mb-3 text-red-500 text-sm flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{emailError}</div>}
                  {emailSuccess ? (
                    <div className="text-green-600 dark:text-green-500 text-sm flex gap-2"><CheckCircle2 className="w-5 h-5 shrink-0" />Confirmation links sent to both emails.</div>
                  ) : (
                    <form onSubmit={handleUpdateEmail} className="flex gap-2">
                      <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-[15px] outline-none focus:border-blue-500" placeholder="New Email" />
                      <button type="submit" disabled={isUpdatingEmail || !newEmail || newEmail === currentEmail} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[15px] disabled:opacity-50 transition-colors">
                        {isUpdatingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Password Row */}
            <div>
              <button 
                onClick={() => setIsEditingPassword(!isEditingPassword)}
                className="w-full flex items-center justify-between p-4 bg-white dark:bg-[#1c1c1e] hover:bg-gray-50 dark:hover:bg-[#2c2c2e] transition-colors"
              >
                <span className="text-[17px] text-gray-900 dark:text-white flex items-center gap-3">
                  <KeyRound className="w-5 h-5 text-gray-400" /> Password
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[17px] text-gray-500 dark:text-gray-400">••••••••</span>
                  <ChevronRight className={`w-5 h-5 text-gray-300 dark:text-gray-600 transition-transform ${isEditingPassword ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {/* Password Edit Panel */}
              {isEditingPassword && (
                <div className="p-4 bg-gray-50 dark:bg-[#151515] border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2 fade-in duration-200">
                  {passwordError && <div className="mb-3 text-red-500 text-sm flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{passwordError}</div>}
                  {passwordSuccess ? (
                    <div className="text-green-600 dark:text-green-500 text-sm flex gap-2"><CheckCircle2 className="w-5 h-5 shrink-0" />Password updated successfully!</div>
                  ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-3">
                      <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-[15px] outline-none focus:border-blue-500" placeholder="New Password" />
                      <div className="flex gap-2">
                        <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-[15px] outline-none focus:border-blue-500" placeholder="Confirm Password" />
                        <button type="submit" disabled={isUpdatingPassword || !newPassword || !confirmPassword} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[15px] disabled:opacity-50 transition-colors">
                          {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* SIGN OUT */}
        <section className="pt-4 flex justify-center">
          <div className="w-full sm:w-auto">
            <SignOutButton />
          </div>
        </section>

      </div>
    </div>
  )
}