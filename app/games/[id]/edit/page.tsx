'use client'

import { useState, useEffect, use } from 'react'
import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, MapPin, Cloud, Flag, Shield, Save, Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { Map, X } from 'lucide-react'

function EditGameContent() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form State
  const [opponent, setOpponent] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [location, setLocation] = useState('')
  const [field, setField] = useState('')
  const [weather, setWeather] = useState('')
  const [showFieldMap, setShowFieldMap] = useState(false)

  useEffect(() => {
    async function fetchGame() {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single()
      
      if (data) {
        setOpponent(data.opposing_team || '')
        setDate(data.game_date || '')
        setTime(data.game_time || '')
        setLocation(data.location || '')
        setField(data.field || '')
        setWeather(data.weather || '')
      }
      setLoading(false)
    }
    fetchGame()
  }, [id, supabase])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('games')
      .update({
        opposing_team: opponent,
        game_date: date,
        game_time: time,
        location: location,
        field: field,
        weather: weather
      })
      .eq('id', id)

    if (!error) {
      // Send them back to the lineup page
      router.push(`/games/${id}`)
      router.refresh()
    } else {
      console.error(error)
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 w-full pb-24 sm:pt-16">
      <Link href={`/games/${id}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Lineup
      </Link>

      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-8">Edit Game</h1>
      <button 
  type="button"
  onClick={() => setShowFieldMap(true)}
  className="inline-flex items-center px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all"
>
  <Map className="w-4 h-4 mr-2" />
  Field Map
</button>

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
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
        <div>
  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
    Team Announcement / Notes <span className="text-gray-400 font-normal">(Optional)</span>
  </label>
  <textarea
    name="notes"
    rows={3}
    placeholder="e.g. Wear the red jerseys today! Post-game drinks at the pub."
    className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-y"
    /* If using controlled state, add: value={notes} onChange={(e) => setNotes(e.target.value)} */
  />
</div>

        <button type="submit" disabled={saving || !date} className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 text-lg shadow-sm">
          {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </form>

      {showFieldMap && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-4 sm:p-6 max-w-2xl w-full border border-gray-100 dark:border-gray-800 relative shadow-2xl">
            <button
              onClick={() => setShowFieldMap(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-4 pr-10">Field Positions</h2>
            
            <div className="rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-2">
              <img 
                src="/assets/kicksheet_positions.jpg" 
                alt="Kickball Field Positions Diagram" 
                className="w-full h-auto rounded-xl"
              />
            </div>
            
            <button
              onClick={() => setShowFieldMap(false)}
              className="mt-6 w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold rounded-xl transition-colors"
            >
              Close Map
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
export default function EditGamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-gray-950">
        <div className="w-8 h-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <EditGameContent />
    </Suspense>
  )
}