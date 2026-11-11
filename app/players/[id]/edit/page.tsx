'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Save, Hash, Crosshair, User } from 'lucide-react'
import Link from 'next/link'
import { useSettingsStore } from '@/store/useSettingsStore'

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

const parsePositions = (data: any): string[] => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (typeof data === 'string') {
    const cleaned = data.replace(/^\{|\}$|^\[|\]$/g, '').replace(/"|'/g, '')
    return cleaned.split(',').map(s => s.trim()).filter(Boolean)
  }
  return []
}

function EditPlayerContent() {
  const params = useParams()
  const playerId = params.id as string
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState('')

  const [name, setName] = useState('')
  const { askForJerseyNumbers } = useSettingsStore()
  const [experienceLevel, setExperienceLevel] = useState('Experienced')
  const [positions, setPositions] = useState<string[]>([])
  const [kickingStyle, setKickingStyle] = useState('')

  useEffect(() => {
    if (!playerId) return

    async function fetchPlayer() {
      const { data, error } = await supabase
        .from('players')
        .select('*, teams(name)')
        .eq('id', playerId)
        .single()

      if (data && !error) {
        setName(data.name || '')
        setNumber(data.number ? String(data.number) : '')
        
        // Merge legacy preferred_positions and new positions fields securely
        const mergedPositions = [
          ...parsePositions(data.positions),
          ...parsePositions(data.preferred_positions)
        ]
        setPositions(Array.from(new Set(mergedPositions)))
        
        setKickingStyle(data.kicking_style || '')
        setTeamId(data.team_id)
        if (data.teams) setTeamName(data.teams.name)
      }
      setLoading(false)
    }
    
    fetchPlayer()
  }, [playerId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('players')
      .update({
        name: name.trim(),
        number: number ? parseInt(number, 10) : null,
        experience_level: experienceLevel,
        positions: positions,
        kicking_style: kickingStyle || null
      })
      .eq('id', playerId)

    if (error) {
      console.error(error)
      alert('Failed to update player')
      setSaving(false)
    } else {
      router.push(`/teams/${teamId}`)
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 transition-colors py-10 px-4 sm:py-20">
      <div className="max-w-xl mx-auto space-y-6">
        
        <Link href={`/teams/${teamId}`} className="inline-flex items-center text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to {teamName || 'Roster'}
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">Edit Player</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Update profile details and preferences.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`grid gap-4 ${askForJerseyNumbers ? 'sm:grid-cols-3' : 'grid-cols-1'}`}>
  <div className={`${askForJerseyNumbers ? 'sm:col-span-2' : ''} space-y-1.5`}>
    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
      <User className="w-3.5 h-3.5" /> Full Name
    </label>
    <input 
      required 
      type="text" 
      value={name}
      onChange={e => setName(e.target.value)}
      className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-semibold text-gray-900 dark:text-white" 
      placeholder="e.g. John Doe"
    />
  </div>
  
  {askForJerseyNumbers && (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
        <Hash className="w-3.5 h-3.5" /> Jersey #
      </label>
      <input 
        type="number" 
        value={number}
        onChange={e => setNumber(e.target.value)}
        className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-semibold text-gray-900 dark:text-white" 
      />
    </div>
  )}
</div>

            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center justify-between">
                <span>Field Positions</span>
                <span className="text-[9px] text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">Tap to toggle</span>
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {POSITIONS.map(pos => {
                  const isSelected = positions.includes(pos.id)
                  return (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setPositions(prev => prev.includes(pos.id) ? prev.filter(p => p !== pos.id) : [...prev, pos.id])}
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

            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5" /> Kicking Style
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                {['Power', 'Placement', 'Bunt', 'Mixed Bag'].map(style => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => setKickingStyle(style)}
                    className={`px-3 py-3 rounded-xl text-sm font-bold transition-all border active:scale-95 ${
                      kickingStyle === style
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500'
                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <button 
                type="submit"
                disabled={saving || !name}
                className="w-full flex items-center justify-center gap-2 bg-[#2563eb] text-white text-base font-bold py-4 rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

export default function EditPlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <EditPlayerContent />
    </Suspense>
  )
}