'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, MapPin, Flag, Users, Save, Loader2, Shield } from 'lucide-react'

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
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function fetchTeams() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('teams')
        .select('*')
        .eq('owner_id', user.id)
        .order('name') // Keep dropdown alphabetical for readability
      
      if (data) {
        setTeams(data)
        if (data.length > 0) {
          // Find the most recently created team to set as the default
          const newestTeam = [...data].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
          setTeamId(newestTeam.id)
        }
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
      <div className="max-w-3xl mx-auto px-4 mt-4 pt-10 pb-24 sm:px-6 sm:pt-24 w-full space-y-6 sm:space-y-8">
        
        <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>

        <header className="w-full flex items-center px-1">
          <h1 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">
            Create New Game
          </h1>
        </header>

        <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6 sm:space-y-8 transition-colors">
          
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="flex flex-col">
              <label className="flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                <Users className="w-3.5 h-3.5 mr-1.5 text-purple-500" /> Your Team *
              </label>
              <select required value={teamId} onChange={(e) => setTeamId(e.target.value)} className="min-w-0 w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-[15px] text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-bold transition-all cursor-pointer">
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                <Shield className="w-3.5 h-3.5 mr-1.5 text-rose-500" /> Opponent
              </label>
              <input type="text" value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="e.g. Pump Fiction" className="min-w-0 w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-[15px] text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-bold transition-all placeholder:text-gray-400" />
            </div>

            <div className="flex flex-col">
              <label className="flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> Date *
              </label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="min-w-0 w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-[15px] text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-bold transition-all" />
            </div>

            <div className="flex flex-col">
              <label className="flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-orange-500" /> Time
              </label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="min-w-0 w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-[15px] text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-bold transition-all" />
            </div>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          <div className="space-y-4 sm:space-y-6">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Game Details</h3>
            
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex flex-col">
                <label className="flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> Location
                </label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. DeWitt-Clinton Park" className="min-w-0 w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-[15px] text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-bold transition-all placeholder:text-gray-400" />
              </div>
              
              <div className="flex flex-col">
                <label className="flex items-center text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                  <Flag className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> Field
                </label>
                <input type="text" value={field} onChange={(e) => setField(e.target.value)} placeholder="e.g. NW" className="min-w-0 w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 text-[15px] text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 font-bold transition-all placeholder:text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1.5">
                Team Announcement / Notes <span className="text-gray-400 font-bold ml-1">(Optional)</span>
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="e.g. Wear the red jerseys today! Post-game drinks at the pub."
                className="min-w-0 w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 text-[15px] font-bold focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-y placeholder:text-gray-400"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" disabled={saving || !teamId || !date} className="w-full py-4 mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 text-[15px] sm:text-base shadow-lg shadow-blue-500/20">
            {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            {saving ? 'Creating Game...' : 'Create Game'}
          </button>
        </form>
      </div>
    </div>
  )
}