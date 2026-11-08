'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Hash, Crosshair, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react'
import { joinTeamAction, getTeamDetailsAction } from '@/app/actions/join-team'

const POSITIONS = [
  { id: 'P', name: 'Pitcher', color: 'bg-[#ec0000] text-white' },
  { id: 'C', name: 'Catcher', color: 'bg-[#9942cc] text-white' },
  { id: '1B', name: '1st Base', color: 'bg-[#ff6a66] text-white' },
  { id: '2B', name: '2nd Base', color: 'bg-[#ff8800] text-white' },
  { id: '3B', name: '3rd Base', color: 'bg-[#e3005c] text-white' },
  { id: 'SS', name: 'Short Stop', color: 'bg-[#dbcc07] text-gray-900' },
  { id: 'LF', name: 'Left Field', color: 'bg-[#1e40af] text-white' },
  { id: 'LC', name: 'Left Center', color: 'bg-[#03a9f4] text-white' },
  { id: 'RC', name: 'Right Center', color: 'bg-[#00be99] text-white' },
  { id: 'RF', name: 'Right Field', color: 'bg-[#43a047] text-white' },
]

function JoinTeamContent() {
  const params = useParams()
  
  // Robustly extract the ID regardless of what the folder is named
  const teamId = (params.id || Object.values(params)[0]) as string

  const [team, setTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    number: '',
    kickingStyle: '',
    positions: [] as string[]
  })

  useEffect(() => {
    if (!teamId) return
    
    async function fetchTeam() {
      // Bypasses RLS to securely fetch the team name for the unauthenticated user
      const data = await getTeamDetailsAction(teamId)
      setTeam(data)
      setLoading(false)
    }
    
    fetchTeam()
  }, [teamId])

  const togglePosition = (posId: string) => {
    setFormData(prev => ({
      ...prev,
      positions: prev.positions.includes(posId) 
        ? prev.positions.filter(p => p !== posId)
        : [...prev.positions, posId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    
    const result = await joinTeamAction({
      teamId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      number: formData.number,
      positions: formData.positions,
      kickingStyle: formData.kickingStyle
    })
    
    setSubmitting(false)
    
    if (result.success) {
      setSuccess(true)
    } else {
      alert('Failed to join team: ' + result.error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!team && !loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Team Not Found</h1>
        <p className="text-gray-500 font-medium">This invite link is invalid or has expired.</p>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">You're on the roster!</h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium text-lg max-w-sm">
          Your profile has been added to <strong>{team.name}</strong>. The captain now has your info.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-[#f8f9fa] dark:bg-gray-950 flex flex-col items-center py-10 px-4 sm:py-20 antialiased transition-colors">
      
      <div className="max-w-md w-full text-center mb-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
        {team.logo_url ? (
          <img src={team.logo_url} alt={team.name} className="w-20 h-20 mx-auto rounded-2xl object-cover shadow-sm mb-4 border border-gray-200 dark:border-gray-800" />
        ) : (
          <div className="w-20 h-20 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 border border-blue-200 dark:border-blue-800/50">
            <ShieldCheck className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
        )}
        <h2 className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">You're Invited</h2>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-3">
          Join {team.name}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Fill out your player card to be added to the official roster.</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-200 dark:border-gray-800 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150 fill-mode-both space-y-8">
        
        <div className="space-y-4">
          <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">1. The Basics</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider ml-1">First Name</label>
              <input 
                required 
                type="text" 
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-semibold text-gray-900 dark:text-white" 
                placeholder="Jane" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider ml-1">Last Name</label>
              <input 
                required 
                type="text" 
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-semibold text-gray-900 dark:text-white" 
                placeholder="Doe" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" /> Preferred Jersey #
            </label>
            <input 
              type="number" 
              value={formData.number}
              onChange={e => setFormData({...formData, number: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-semibold text-gray-900 dark:text-white" 
              placeholder="e.g. 99" 
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center justify-between">
            <span>2. Field Positions</span>
            <span className="text-[9px] text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">Tap all you like</span>
          </h3>
          
          <div className="grid grid-cols-5 gap-2">
            {POSITIONS.map(pos => {
              const isSelected = formData.positions.includes(pos.id)
              return (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => togglePosition(pos.id)}
                  className={`flex flex-col items-center justify-center aspect-square rounded-xl transition-all duration-200 active:scale-95 border ${
                    isSelected 
                      ? `${pos.color.split(' ')[0]} border-transparent shadow-md ring-2 ring-blue-500/30 ring-offset-1 dark:ring-offset-gray-900` 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={`text-sm sm:text-base font-black tracking-tighter ${isSelected ? pos.color.split(' ')[1] : 'text-gray-400 dark:text-gray-500'}`}>
                    {pos.id}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5" /> 3. Kicking Style
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {['Power', 'Placement', 'Bunt / Speed'].map(style => (
              <button
                key={style}
                type="button"
                onClick={() => setFormData({...formData, kickingStyle: style})}
                className={`px-3 py-3 rounded-xl text-sm font-bold transition-all border active:scale-95 ${
                  formData.kickingStyle === style
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <button 
          type="submit"
          disabled={submitting || !formData.firstName || !formData.lastName}
          className="w-full flex items-center justify-center gap-2 bg-[#2563eb] text-white text-base font-bold py-4 rounded-2xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 group mt-4 shadow-lg shadow-blue-600/20"
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Join Team Roster <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

      </form>
      
      <div className="mt-8 text-center animate-in fade-in duration-700 delay-500 fill-mode-both">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Powered by</p>
        <img src="/assets/kicksheet-logo.png" alt="Kicksheet" className="h-4 mx-auto mt-2 opacity-50 dark:hidden grayscale" />
        <img src="/assets/kicksheet-logo-white.png" alt="Kicksheet" className="h-4 mx-auto mt-2 opacity-30 hidden dark:block" />
      </div>
    </div>
  )
}

export default function JoinTeamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <JoinTeamContent />
    </Suspense>
  )
}