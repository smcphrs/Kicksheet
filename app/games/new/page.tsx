'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useDraftStore } from '@/store/useDraftStore'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, MapPin, Users, Flag, Cloud, Loader2 } from 'lucide-react'

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

  // 1. Fetch Teams and Hydrate Draft Store on Mount
  useEffect(() => {
    setMounted(true)
    
    // Load existing draft data if present
    if (store.selectedTeamId) setTeamId(store.selectedTeamId)
    if (store.gameInfo) {
      setDate(store.gameInfo.gameDate.split('T')[0]) // format for html input
      setTime(store.gameInfo.gameTime)
      setOpponent(store.gameInfo.opposingTeam)
      setLocation(store.gameInfo.location)
      setField(store.gameInfo.field)
      setWeather(store.gameInfo.weather)
    } else {
      // Set defaults for a brand new draft
      setDate(new Date().toISOString().split('T')[0])
      setTime('18:00') // 6:00 PM default
    }

    // Fetch user's teams for the dropdown
    async function fetchTeams() {
      const { data } = await supabase.from('teams').select('id, name').order('created_at', { ascending: false })
      if (data) {
        setTeams(data)
        // Auto-select if they only have one team
        if (data.length === 1 && !store.selectedTeamId) {
          setTeamId(data[0].id)
        }
      }
      setLoadingTeams(false)
    }
    
    fetchTeams()
  }, [])

  // Handle the transition to Step 2
  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()

    // Save everything to the auto-persisting Zustand store
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

    // Move to the Attendance step!
    router.push('/games/new/attendance')
  }

  // Prevent hydration mismatch by returning null until Zustand mounts
  if (!mounted) return null

  return (
    <div className="max-w-2xl mx-auto p-6 w-full pb-24">
      <div className="flex items-center justify-between mb-8">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Cancel
        </Link>
        <span className="text-sm font-bold text-gray-400">Step 1 of 4</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Game Details</h1>
        <p className="text-gray-500 mt-2">When and where is the game happening?</p>
      </div>

      <form onSubmit={handleContinue} className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        
        {/* Team Selector */}
        <div className="space-y-2 pb-6 border-b border-gray-100">
          <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Users className="w-4 h-4 text-gray-400" />
            Select Your Team *
          </label>
          {loadingTeams ? (
            <div className="h-12 flex items-center text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin mr-2"/> Loading teams...</div>
          ) : (
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900 bg-white"
            >
              <option value="" disabled>Choose a team...</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Calendar className="w-4 h-4 text-gray-400" />
              Game Date *
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
              <Clock className="w-4 h-4 text-gray-400" />
              Game Time *
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
            <Users className="w-4 h-4 text-gray-400" />
            Opposing Team
          </label>
          <input
            type="text"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            placeholder="e.g. The Blue Barracudas"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <MapPin className="w-4 h-4 text-gray-400" />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Centennial Park"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Flag className="w-4 h-4 text-gray-400" />
              Field
            </label>
            <input
              type="text"
              value={field}
              onChange={(e) => setField(e.target.value)}
              placeholder="e.g. Field 3"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Cloud className="w-4 h-4 text-gray-400" />
              Weather
            </label>
            <input
              type="text"
              value={weather}
              onChange={(e) => setWeather(e.target.value)}
              placeholder="e.g. Sunny, 75°F"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition-all text-gray-900"
            />
          </div>
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