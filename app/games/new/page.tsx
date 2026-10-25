'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, MapPin, Cloud, Flag, Users, Save, Loader2 } from 'lucide-react'

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
  }, [])

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
        weather: weather
      }])
      .select()
      .single()

    if (!error && data) {
      // Send them right to the lineup generator for this game
      router.push(`/games/${data.id}`)
    } else {
      console.error(error)
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 w-full pb-24">
      <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">Create New Game</h1>

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center text-sm font-bold text-gray-700">
              <Users className="w-4 h-4 mr-2 text-blue-600" /> Your Team *
            </label>
            <select required value={teamId} onChange={(e) => setTeamId(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-600/20 font-medium transition-all cursor-pointer">
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-bold text-gray-700">
              <Shield className="w-4 h-4 mr-2 text-blue-600" /> Opponent
            </label>
            <input type="text" value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="e.g. Pump Fiction" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-600/20 font-medium transition-all" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-bold text-gray-700">
              <Calendar className="w-4 h-4 mr-2 text-blue-600" /> Date *
            </label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-600/20 font-medium transition-all" />
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-bold text-gray-700">
              <Clock className="w-4 h-4 mr-2 text-blue-600" /> Time
            </label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-600/20 font-medium transition-all" />
          </div>
        </div>

        <hr className="border-gray-100" />

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider text-center">Game Details</h3>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-gray-700">
                <MapPin className="w-4 h-4 mr-2 text-blue-600" /> Location
              </label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. DeWitt-Clinton Park" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-600/20 font-medium transition-all" />
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center text-sm font-bold text-gray-700">
                <Flag className="w-4 h-4 mr-2 text-blue-600" /> Field
              </label>
              <input type="text" value={field} onChange={(e) => setField(e.target.value)} placeholder="e.g. NW" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-600/20 font-medium transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center text-sm font-bold text-gray-700">
              <Cloud className="w-4 h-4 mr-2 text-blue-600" /> Weather Details
            </label>
            <input type="text" value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="e.g. Sunny, Cool 55 F" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-blue-600/20 font-medium transition-all" />
          </div>
        </div>

        <button type="submit" disabled={saving || !teamId || !date} className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 text-lg shadow-sm">
          {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          {saving ? 'Creating Game...' : 'Create Game'}
        </button>
      </form>
    </div>
  )
}

// A small helper icon missing from the imports above
function Shield(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
}