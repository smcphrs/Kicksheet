'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSettingsStore } from '@/store/useSettingsStore'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, User, Wand2, AlertTriangle, RotateCcw, Map } from 'lucide-react'
import { FieldMapModal } from '@/components/FieldMapModal'

const POSITIONS = {
  INFIELD: ['P', 'C', '1B', '2B', '3B', 'SS'],
  OUTFIELD: ['LF', 'LC', 'RC', 'RF'],
  BENCH: ['Bench']
}
const ALL_POSITIONS = [...POSITIONS.BENCH, ...POSITIONS.INFIELD, ...POSITIONS.OUTFIELD]
const FIELD_POSITIONS = [...POSITIONS.INFIELD, ...POSITIONS.OUTFIELD]

function PositionsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const supabase = createClient()
  
  const { fairPlayEnabled, inningsCount } = useSettingsStore()
  const INNINGS = Array.from({ length: inningsCount || 7 }, (_, i) => i + 1)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)
  
  const [players, setPlayers] = useState<any[]>([])
  const [activeInning, setActiveInning] = useState(1)
  const [assignments, setAssignments] = useState<Record<number, Record<string, string>>>({})

  useEffect(() => {
    if (!id) return

    async function fetchGameAndPlayers() {
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single()

      if (gameError || !game) {
        setError("Could not load game data.")
        setLoading(false)
        return
      }

      if (!game.kicking_order || game.kicking_order.length === 0) {
        router.replace(`/games/new/kicking-order?id=${id}`)
        return
      }

      let fetchedRoster: any[] = []
      const regularIds = game.kicking_order.filter((pid: string) => !pid.startsWith('sub-'))

      if (regularIds.length > 0) {
        const { data } = await supabase
          .from('players')
          .select('id, name, preferred_positions')
          .in('id', regularIds)
        
        if (data) fetchedRoster = data
      }

      const subs = game.subs || []
      const combined = [
        ...fetchedRoster,
        ...subs.map((sub: any) => ({ ...sub, isSub: true, preferred_positions: [] }))
      ]

      combined.sort((a, b) => game.kicking_order.indexOf(a.id) - game.kicking_order.indexOf(b.id))
      setPlayers(combined)

      if (game.innings && game.innings.length > 0) {
        const loadedAssignments: Record<number, Record<string, string>> = {}
        game.innings.forEach((inningObj: any) => {
          loadedAssignments[inningObj.inning] = inningObj.assignments || {}
        })
        setAssignments(loadedAssignments)
      }

      setLoading(false)
    }

    fetchGameAndPlayers()
  }, [id, supabase, router])

  // --- HISTORICAL DATA LOGIC ---
  const benchCounts: Record<string, number> = {}
  players.forEach(p => benchCounts[p.id] = 0)
  
  Object.values(assignments).forEach(inningAssignments => {
    Object.entries(inningAssignments).forEach(([playerId, pos]) => {
      if (pos === 'Bench') {
        benchCounts[playerId] = (benchCounts[playerId] || 0) + 1
      }
    })
  })

  const unbenchedPlayers = players.filter(p => benchCounts[p.id] === 0)

  const handlePositionChange = (playerId: string, position: string) => {
    setAssignments(prev => ({
      ...prev,
      [activeInning]: {
        ...(prev[activeInning] || {}),
        [playerId]: position
      }
    }))
  }

  const handleResetInning = () => {
    setAssignments(prev => ({
      ...prev,
      [activeInning]: {} 
    }))
  }

  // --- SMART AI ALGORITHM: FULL GAME AUTO-FILL ---
  const handleAutoFillAllInnings = () => {
    if (!window.confirm("This will auto-generate positions for the ENTIRE game, overwriting your current assignments. Continue?")) return

    const newAssignments: Record<number, Record<string, string>> = {}
    const tempBenchCounts: Record<string, number> = {}
    const tempPosCounts: Record<string, Record<string, number>> = {}
    
    players.forEach(p => {
      tempBenchCounts[p.id] = 0
      tempPosCounts[p.id] = {}
    })

    INNINGS.forEach(inningNum => {
      newAssignments[inningNum] = {}
      let availablePositions = [...FIELD_POSITIONS]
      let unassignedPlayers = [...players]

      // 1. FAIR PLAY BENCH ROTATION
      const numToBench = Math.max(0, players.length - FIELD_POSITIONS.length)
      if (numToBench > 0) {
        unassignedPlayers.sort((a, b) => {
          const aBenches = tempBenchCounts[a.id]
          const bBenches = tempBenchCounts[b.id]
          // Prioritize sitting players who have sat the LEAST
          if (aBenches !== bBenches) return bBenches - aBenches
          return 0.5 - Math.random() // Random tie-breaker
        })
        
        const benched = unassignedPlayers.splice(unassignedPlayers.length - numToBench, numToBench)
        benched.forEach(p => { 
          newAssignments[inningNum][p.id] = 'Bench'
          tempBenchCounts[p.id]++
        })
      }

      // 2. ASSIGN PREFERRED POSITIONS
      unassignedPlayers.sort((a, b) => {
        const aPrefCount = a.preferred_positions?.length || 0
        const bPrefCount = b.preferred_positions?.length || 0
        if (aPrefCount === 0) return 1
        if (bPrefCount === 0) return -1
        return aPrefCount - bPrefCount // Strictest preferences get placed first
      })

      for (let i = unassignedPlayers.length - 1; i >= 0; i--) {
        const p = unassignedPlayers[i]
        const prefs = p.preferred_positions || []
        
        // Try to assign a preference they haven't played much today
        const sortedPrefs = [...prefs].sort((posA, posB) => {
          const countA = tempPosCounts[p.id][posA] || 0
          const countB = tempPosCounts[p.id][posB] || 0
          return countA - countB
        })

        const chosenPos = sortedPrefs.find(pos => availablePositions.includes(pos))
        if (chosenPos) {
          newAssignments[inningNum][p.id] = chosenPos
          tempPosCounts[p.id][chosenPos] = (tempPosCounts[p.id][chosenPos] || 0) + 1
          availablePositions.splice(availablePositions.indexOf(chosenPos), 1)
          unassignedPlayers.splice(i, 1)
        }
      }

      // 3. FILL REMAINDER
      unassignedPlayers.forEach(p => {
        availablePositions.sort((posA, posB) => {
          const countA = tempPosCounts[p.id][posA] || 0
          const countB = tempPosCounts[p.id][posB] || 0
          return countA - countB
        })

        const pos = availablePositions.shift()
        if (pos) {
          newAssignments[inningNum][p.id] = pos
          tempPosCounts[p.id][pos] = (tempPosCounts[p.id][pos] || 0) + 1
        } else {
          newAssignments[inningNum][p.id] = 'Bench' // Fallback for rovers/extras
        }
      })
    })

    setAssignments(newAssignments)
    setActiveInning(1) // Jump back to inning 1 so they can review the results
  }

  const handleSaveGame = async () => {
  setSaving(true)
  setError(null)

  try {
    const formattedInnings = INNINGS.map(inningNum => ({
      inning: inningNum,
      assignments: assignments[inningNum] || {}
    }))

    const { error: updateError } = await supabase
      .from('games')
      .update({
        innings: formattedInnings,
        status: 'scheduled'
      })
      .eq('id', id)

    if (updateError) throw updateError

    // FIX: Stop the spinner immediately upon success
    setSaving(false) 

    router.refresh()
    router.push(`/games/${id}`) 

  } catch (err: any) {
    console.error('Error saving positions:', err)
    setError(err.message || 'Failed to save positions. Please try again.')
    setSaving(false)
  }
}

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    )
  }

  const currentInningAssignments = assignments[activeInning] || {}
  const activePlayerIds = players.map(p => p.id)
  const takenPositions = Object.entries(currentInningAssignments)
    .filter(([playerId, pos]) => pos !== 'Bench' && activePlayerIds.includes(playerId))
    .map(([_, pos]) => pos)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto p-4 w-full pt-8 sm:pt-24 pb-48">
        
        <div className="flex items-center justify-between mb-8">
          <Link href={`/games/new/kicking-order?id=${id}`} className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors mb-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Order
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-xs font-black text-[#2563eb] dark:text-blue-400 uppercase tracking-widest mb-2">Step 3 of 3</h2>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">Field Positions</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-2 text-lg">Assign the positions for each inning.</p>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-2 mt-5 w-full">
            <button
              onClick={() => setShowMap(true)}
              className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 font-bold rounded-lg transition-all active:scale-95 shadow-sm text-xs sm:text-sm"
            >
              Map
            </button>
            <button
              onClick={handleResetInning}
              className="inline-flex items-center justify-center px-3 py-1.5 sm:px-4 sm:py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 font-bold rounded-lg transition-all active:scale-95 shadow-sm text-xs sm:text-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
              Reset
            </button>
            <button
              onClick={handleAutoFillAllInnings}
              className="inline-flex items-center justify-center px-4 py-1.5 sm:px-5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-all active:scale-95 shadow-md shadow-purple-900/20 text-xs sm:text-sm"
            >
              <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
              Auto-Fill Game
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold shadow-sm">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-300 dark:border-gray-700 overflow-hidden mb-8 shadow-xl shadow-blue-900/5 dark:shadow-none transition-colors">
          
          <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 hide-scrollbar bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
            {INNINGS.map(inning => (
              <button
                key={inning}
                onClick={() => setActiveInning(inning)}
                className={`flex-1 min-w-[70px] py-4 text-sm font-bold transition-all border-b-2 ${
                  activeInning === inning
                    ? 'border-[#2563eb] text-[#2563eb] dark:text-blue-400 bg-white dark:bg-gray-800 shadow-sm'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Inn {inning}
              </button>
            ))}
          </div>

          <div className="p-2 sm:p-4 divide-y divide-gray-100 dark:divide-gray-800">
            {players.map((player, idx) => {
              const currentPosition = currentInningAssignments[player.id] || 'Bench'
              
              const isAvailable = (pos: string) => pos === 'Bench' || pos === currentPosition || !takenPositions.includes(pos)
              
              const showFairPlayWarning = 
                fairPlayEnabled && 
                currentPosition === 'Bench' && 
                benchCounts[player.id] > 1 && 
                unbenchedPlayers.length > 0 &&
                !unbenchedPlayers.some(p => p.id === player.id)
              
              return (
                <div key={player.id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-400 font-black flex items-center justify-center text-sm shrink-0 shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="font-bold text-gray-900 dark:text-white text-base sm:text-lg tracking-tight flex items-center">
                        {player.name}
                        {player.isSub && (
                          <span className="ml-2 text-[10px] uppercase font-black bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-400 px-2 py-0.5 rounded-md inline-flex items-center">
                            <User className="w-3 h-3 mr-1" /> Sub
                          </span>
                        )}
                      </div>
                    </div>

                    <select
                      value={currentPosition}
                      onChange={(e) => handlePositionChange(player.id, e.target.value)}
                      className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border font-black text-sm outline-none transition-colors cursor-pointer appearance-none text-center min-w-[80px] sm:min-w-[100px] shadow-sm ${
                        currentPosition !== 'Bench' 
                          ? 'bg-[#2563eb] border-[#2563eb] text-white' 
                          : showFairPlayWarning 
                            ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400'
                            : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      <option value="Bench">Bench</option>
                      <optgroup label="Infield">
                        {POSITIONS.INFIELD.map(pos => isAvailable(pos) && (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Outfield">
                        {POSITIONS.OUTFIELD.map(pos => isAvailable(pos) && (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {showFairPlayWarning && (
                    <div className="mt-3 ml-11 sm:ml-12 flex items-start gap-2 text-xs font-bold text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span className="leading-tight">
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

        {/* Sticky Footer Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 sm:pb-4 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-300 dark:border-gray-800 z-[9999] transition-colors">
          <div className="max-w-2xl mx-auto flex justify-end">
            <button
              onClick={handleSaveGame}
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#43a047] hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-green-900/20 text-base"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Game...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Lineup
                </>
              )}
            </button>
          </div>
        </div>

        {/* Render Map Modal if toggled */}
        {showMap && <FieldMapModal isOpen={showMap} onClose={() => setShowMap(false)} />}
      </div>
    </div>
  )
}

export default function PositionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 flex items-center justify-center transition-colors">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    }>
      <PositionsContent />
    </Suspense>
  )
}