'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, MapPin, Cloud, Flag, Users, Save, Loader2, Shield } from 'lucide-react'

export default function NewGamePage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form State
  const [teamId, setTeamId] = useState('')
  const [opponent, setOpponent] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [field, setField] = useState('')
  const [weather, setWeather] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function fetchTeams() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user.id)
        .order('name')
      
      if (data) {
        setTeams(data)
        if (data.length > 0) setTeamId(data[0].id)
      }
      setLoading(false)
    }
    fetchTeams()
  }, [supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('games')
      .insert([{
        user_id: user.id,
        team_id: teamId,
        opposing_team: opponent,
        game_date: date,
        game_time: time,
        location: location,
        field: field,
        weather: weather,
        notes: notes, 
      }])
      .select()
      .single()

    if (!error && data) {
      router.push(`/games/new/attendance?id=${data.id}`)
    } else {
      console.error(error)
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pt-12 sm:pt-24 w-full pb-24">
        
        <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>

        <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white mb-8">Create New Game</h1>

        <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-300 dark:border-gray-700 space-y-6 transition-colors">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-gray-700 dark:text-gray-300">
                <Users className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" /> Your Team *
              </label>
              <select required value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 font-bold transition-all cursor-pointer">
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-gray-700 dark:text-gray-300">
                <Shield className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" /> Opponent
              </label>
              <input type="text" value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="e.g. Pump Fiction" className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 font-bold transition-all placeholder:text-gray-400" />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" /> Date *
              </label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 font-bold transition-all" />
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-gray-700 dark:text-gray-300">
                <Clock className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" /> Time
              </label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 font-bold transition-all" />
            </div>
          </div>

          <hr className="border-gray-300 dark:border-gray-700" />

          <div className="space-y-4">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest text-center">Game Details</h3>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-gray-700 dark:text-gray-300">
                  <MapPin className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" /> Location
                </label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. DeWitt-Clinton Park" className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 font-bold transition-all placeholder:text-gray-400" />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center text-sm font-bold text-gray-700 dark:text-gray-300">
                  <Flag className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" /> Field
                </label>
                <input type="text" value={field} onChange={(e) => setField(e.target.value)} placeholder="e.g. NW" className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 font-bold transition-all placeholder:text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-gray-700 dark:text-gray-300">
                <Cloud className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" /> Weather Details
              </label>
              <input type="text" value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="e.g. Sunny, Cool 55 F" className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 font-bold transition-all placeholder:text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Team Announcement / Notes <span className="text-gray-400 dark:text-gray-500 font-normal">(Optional)</span>
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="e.g. Wear the red jerseys today! Post-game drinks at the pub."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-y placeholder:text-gray-400"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button type="submit" disabled={saving || !teamId || !date} className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 text-lg">
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            {saving ? 'Creating Game...' : 'Create Game'}
          </button>
        </form>
      </div>
    </div>
  )
}