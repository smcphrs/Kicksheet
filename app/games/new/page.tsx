'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useDraftStore } from '@/store/useDraftStore'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, MapPin, Users, Flag, Cloud, Loader2, RotateCcw } from 'lucide-react'

export default function GameDetailsStep1() {
  const router = useRouter()
  const supabase = createClient()
  const store = useDraftStore()
  
  const [mounted, setMounted] = useState(false)
  const [teams, setTeams] = useState<any[]>([])
  const [loadingTeams, setLoadingTeams] = useState(true)

  // Form State
  const [teamId, setTeamId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [opponent, setOpponent] = useState('')
  const [location, setLocation] = useState('')
  const [field, setField] = useState('')
  const [weather, setWeather] = useState('')

  useEffect(() => {
    setMounted(true)
    
    async function fetchTeams() {
      const { data } = await supabase.from('teams').select('id, name').order('created_at', { ascending: false })
      
      if (data) {
        setTeams(data)
        
        // SECURITY CHECK: Does the browser's saved Team ID actually exist in the DB?
        const savedTeamExists = data.some(t => t.id === store.selectedTeamId)

        if (store.selectedTeamId && savedTeamExists) {
          // Valid draft exists, load it
          setTeamId(store.selectedTeamId)
        } else {
          // The saved team was deleted or is invalid. Wipe it.
          store.setSelectedTeamId(null)
          if (data.length === 1) {
            setTeamId(data[0].id) // Auto-select if they only have 1 valid team
          } else {
            setTeamId('') // Force them to pick if they have multiple
          }
        }
      }
      setLoadingTeams(false)
    }
    
    fetchTeams()

    // Load remaining draft data
    if (store.gameInfo) {
      setDate(store.gameInfo.gameDate.split('T')[0])
      setTime(store.gameInfo.gameTime)
      setOpponent(store.gameInfo.opposingTeam)
      setLocation(store.gameInfo.location)
      setField(store.gameInfo.field)
      setWeather(store.gameInfo.weather)
    } else {
      setDate(new Date().toISOString().split('T')[0])
      setTime('18:00')
    }
  }, [])

  const handleClearDraft = () => {
    if (window.confirm("Are you sure you want to clear your current draft and start fresh?")) {
      store.resetDraft()
      window.location.reload() // Force reload to completely wipe state
    }
  }

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()

    store.setSelectedTeamId(teamId)
    store.setGameInfo({
      gameDate: new Date(date).toISOString(),
      gameTime: time,
      opposingTeam: opponent,
      location,
      field,
      weather
    })
    store.setCurrentStep(1)
    router.push('/games/new/attendance')
  }

  if (!mounted) return null

  return (
    <div className="max-w-2xl mx-auto p-6 w-full pb-24">
      <div className="flex items-center justify-between mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Cancel
        </Link>
        
        {/* Added a button to explicitly wipe buggy local storage drafts */}
        <button 
          onClick={handleClearDraft}
          className="inline-flex items-center text-sm font-bold text-red-500 hover:text-red-700 transition-colors bg-red-50 px-3 py-1.5 rounded-lg"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Start Fresh
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Game Details</h1>
        <p className="text-gray-500 mt-2">When and where is the game happening?</p>
      </div>

      <form onSubmit={handleContinue} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        
        {/* Visually emphasized Team Selector */}
        <div className="space-y-3 pb-6 border-b-2 border-gray-100">
          <label className="flex items-center gap-2 text-base font-extrabold text-blue-900">
            <Users className="w-5 h-5 text-blue-600" />
            Which team is playing? *
          </label>
          {loadingTeams ? (
            <div className="h-12 flex items-center text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2"/> Loading your teams...
            </div>
          ) : (
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              required
              className="w-full px-4 py-4 rounded-xl border-2 border-blue-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 outline-none transition-all text-gray-900 bg-blue-50/30 font-bold text-lg"
            >
              <option value="" disabled>Tap to choose a team...</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Calendar className="w-4 h-4 text-gray-400" /> Game Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Clock className="w-4 h-4 text-gray-400" /> Game Time *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Users className="w-4 h-4 text-gray-400" /> Opposing Team
          </label>
          <input
            type="text"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="e.g. The Blue Barracudas"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900"
          />
        </div>

        <div className="pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={!teamId || !date || !time}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-lg"
          >
            Continue to Attendance
          </button>
        </div>
      </form>
    </div>
  )
}