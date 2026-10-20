'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useDraftStore } from '@/store/useDraftStore'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, User, Sparkles, AlertTriangle } from 'lucide-react'

const POSITIONS = ['Bench', 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LC', 'RC', 'RF', 'EH']
const FIELD_POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LC', 'RC', 'RF', 'EH']
const INNINGS = [1, 2, 3, 4, 5, 6, 7]

export default function PositionsStep4() {
  const router = useRouter()
  const supabase = createClient()
  const store = useDraftStore()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [players, setPlayers] = useState<any[]>([])
  const [activeInning, setActiveInning] = useState(1)
  const [fairPlayEnabled, setFairPlayEnabled] = useState(true) // The new Fair Play Toggle
  
  const [assignments, setAssignments] = useState<Record<number, Record<string, string>>>({})

  useEffect(() => {
    setMounted(true)
    
    if (!store.selectedTeamId || store.kickingOrder.length === 0) {
      router.replace('/games/new/kicking-order')
      return
    }

    async function fetchPlayers() {
      let fetchedRoster: any[] = []
      const regularIds = store.kickingOrder.filter(id => !id.startsWith('sub-'))

      if (regularIds.length > 0) {
        const { data } = await supabase
          .from('players')
          .select('id, name, preferred_positions')
          .in('id', regularIds)
        
        if (data) fetchedRoster = data
      }

      const combined = [
        ...fetchedRoster,
        ...store.subs.map(sub => ({ ...sub, isSub: true, preferred_positions: [] }))
      ]

      combined.sort((a, b) => store.kickingOrder.indexOf(a.id) - store.kickingOrder.indexOf(b.id))
      setPlayers(combined)

      if (store.innings && store.innings.length > 0) {
        const loadedAssignments: Record<number, Record<string, string>> = {}
        store.innings.forEach((inningObj: any) => {
          loadedAssignments[inningObj.inning] = inningObj.assignments || {}
        })
        setAssignments(loadedAssignments)
      }

      setLoading(false)
    }

    fetchPlayers()
  }, [])

  // --- FAIR PLAY CALCULATION LOGIC ---
  // Count how many total times each player is benched across ALL innings
  const benchCounts: Record<string, number> = {}
  players.forEach(p => benchCounts[p.id] = 0)
  
  Object.values(assignments).forEach(inningAssignments => {
    Object.entries(inningAssignments).forEach(([playerId, pos]) => {
      if (pos === 'Bench') {
        benchCounts[playerId] = (benchCounts[playerId] || 0) + 1
      }
    })
  })

  // Find players who haven't sat out a single inning yet
  const unbenchedPlayers = players.filter(p => benchCounts[p.id] === 0)
  // -----------------------------------

  const handlePositionChange = (playerId: string, position: string) => {
    setAssignments(prev => ({
      ...prev,
      [activeInning]: {
        ...(prev[activeInning] || {}),
        [playerId]: position
      }
    }))
  }

  const handleAutoSetInning = () => {
    let unassignedPlayers = [...players]
    const newInningAssignments: Record<string, string> = {}
    const availablePositions = [...FIELD_POSITIONS]

    // Pass 1: Primary Preference (1st choice)
    availablePositions.forEach(pos => {
      const matchIdx = unassignedPlayers.findIndex(p => p.preferred_positions && p.preferred_positions[0] === pos)
      if (matchIdx !== -1) {
        newInningAssignments[unassignedPlayers[matchIdx].id] = pos
        unassignedPlayers.splice(matchIdx, 1)
      }
    })

    // Pass 2: Any Backup Preference
    availablePositions.forEach(pos => {
      if (Object.values(newInningAssignments).includes(pos)) return
      const matchIdx = unassignedPlayers.findIndex(p => p.preferred_positions && p.preferred_positions.includes(pos))
      if (matchIdx !== -1) {
        newInningAssignments[unassignedPlayers[matchIdx].id] = pos
        unassignedPlayers.splice(matchIdx, 1)
      }
    })

    // Pass 3: Fill remaining empty field positions
    availablePositions.forEach(pos => {
      if (Object.values(newInningAssignments).includes(pos)) return
      if (unassignedPlayers.length > 0) {
        newInningAssignments[unassignedPlayers[0].id] = pos
        unassignedPlayers.splice(0, 1)
      }
    })

    // Pass 4: Everyone remaining gets benched
    unassignedPlayers.forEach(p => {
      newInningAssignments[p.id] = 'Bench'
    })

    setAssignments(prev => ({
      ...prev,
      [activeInning]: newInningAssignments
    }))
  }

  const handleSaveGame = async () => {
    setSaving(true)
    setError(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('You must be logged in to save a game.')

      const formattedInnings = INNINGS.map(inningNum => ({
        inning: inningNum,
        assignments: assignments[inningNum] || {}
      }))

      const { error: insertError } = await supabase
        .from('games')
        .insert([{
          user_id: user.id,
          team_id: store.selectedTeamId,
          game_date: store.gameInfo?.gameDate,
          game_time: store.gameInfo?.gameTime,
          opposing_team: store.gameInfo?.opposingTeam,
          location: store.gameInfo?.location,
          field: store.gameInfo?.field,
          weather: store.gameInfo?.weather,
          kicking_order: store.kickingOrder,
          subs: store.subs,
          innings: formattedInnings,
          status: 'scheduled'
        }])

      if (insertError) throw insertError

      store.resetDraft()
      router.refresh()
      router.push('/dashboard')

    } catch (err: any) {
      console.error('Error saving game:', err)
      setError(err.message || 'Failed to save game. Please try again.')
      setSaving(false)
    }
  }

  if (!mounted) return null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6 w-full pb-24">
      <div className="flex items-center justify-between mb-8">
        <Link href="/games/new/kicking-order" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Order
        </Link>
        <span className="text-sm font-bold text-gray-400">Step 4 of 4</span>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Field Positions</h1>
          <p className="text-gray-500 mt-2">Assign field positions for each inning.</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Fair Play Toggle */}
          <label className="flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-3 py-2 rounded-xl shadow-sm">
            <input 
              type="checkbox" 
              checked={fairPlayEnabled}
              onChange={(e) => setFairPlayEnabled(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-sm font-bold text-gray-700">Fair Play Rule</span>
          </label>

          <button
            onClick={handleAutoSetInning}
            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Auto Set Inning
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="flex overflow-x-auto border-b border-gray-100 hide-scrollbar bg-gray-50">
          {INNINGS.map(inning => (
            <button
              key={inning}
              onClick={() => setActiveInning(inning)}
              className={`flex-1 min-w-[60px] py-4 text-sm font-bold transition-colors border-b-2 ${
                activeInning === inning
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Inn {inning}
            </button>
          ))}
        </div>

        <div className="p-2 sm:p-4 divide-y divide-gray-50">
          {players.map((player, idx) => {
            const currentPosition = assignments[activeInning]?.[player.id] || 'Bench'
            
            // Fair Play Check: If rule is ON, they are benched NOW, they are benched MORE THAN ONCE total, and someone else has 0 bench time.
            const showFairPlayWarning = 
              fairPlayEnabled && 
              currentPosition === 'Bench' && 
              benchCounts[player.id] > 1 && 
              unbenchedPlayers.length > 0 &&
              !unbenchedPlayers.some(p => p.id === player.id) // Ensure we aren't suggesting they swap with themselves
            
            return (
              <div key={player.id} className="p-2 sm:p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-gray-100 text-gray-500 font-bold flex items-center justify-center text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div className="font-bold text-gray-900 text-sm sm:text-base flex items-center">
                      {player.name}
                      {player.isSub && (
                        <span className="ml-2 text-[10px] uppercase bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full inline-flex items-center">
                          <User className="w-3 h-3 mr-0.5" /> Sub
                        </span>
                      )}
                    </div>
                  </div>

                  <select
                    value={currentPosition}
                    onChange={(e) => handlePositionChange(player.id, e.target.value)}
                    className={`px-3 py-2 rounded-lg border font-bold text-sm outline-none transition-colors cursor-pointer ${
                      currentPosition !== 'Bench' 
                        ? 'bg-blue-50 border-blue-200 text-blue-700' 
                        : showFairPlayWarning 
                          ? 'bg-amber-100 border-amber-300 text-amber-800' // Make the dropdown orange if warning
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {POSITIONS.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                {/* Fair Play Warning Message */}
                {showFairPlayWarning && (
                  <div className="mt-2 ml-9 flex items-start gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {player.name} is on the bench {benchCounts[player.id]} times. 
                      Consider benching someone with 0 bench time (e.g. {unbenchedPlayers.slice(0, 3).map(p => p.name).join(', ')}) instead.
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleSaveGame}
        disabled={saving}
        className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-lg"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Saving Game...
          </>
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" />
            Save Final Game
          </>
        )}
      </button>
    </div>
  )
}