'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useSettingsStore } from '@/store/useSettingsStore'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, User, Sparkles, AlertTriangle } from 'lucide-react'

const POSITIONS = ['Bench', 'P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LC', 'RC', 'RF']
const FIELD_POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'LC', 'RC', 'RF']

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

      // Sort them perfectly by the Kicking Order we just set in Step 2!
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

  // --- SMART AI ALGORITHM ---
  const handleAutoSetInning = () => {
    const historicalBenchCounts: Record<string, number> = {}
    const historicalPosCounts: Record<string, Record<string, number>> = {}
    
    players.forEach(p => {
      historicalBenchCounts[p.id] = 0
      historicalPosCounts[p.id] = {}
    })

    Object.entries(assignments).forEach(([inningStr, inningAssignments]) => {
      if (parseInt(inningStr) === activeInning) return 
      Object.entries(inningAssignments).forEach(([playerId, pos]) => {
        if (pos === 'Bench') {
          historicalBenchCounts[playerId]++
        } else {
          historicalPosCounts[playerId][pos] = (historicalPosCounts[playerId][pos] || 0) + 1
        }
      })
    })

    let unassignedPlayers = [...players]
    const newInningAssignments: Record<string, string> = {}
    const availablePositions = [...FIELD_POSITIONS]

    const numToBench = Math.max(0, players.length - FIELD_POSITIONS.length)
    if (numToBench > 0) {
      unassignedPlayers.sort((a, b) => {
        if (fairPlayEnabled) {
          const aBenches = historicalBenchCounts[a.id]
          const bBenches = historicalBenchCounts[b.id]
          if (aBenches !== bBenches) return aBenches - bBenches
        }
        if (a.isSub && !b.isSub) return -1
        if (!a.isSub && b.isSub) return 1
        
        const indexA = players.findIndex(p => p.id === a.id)
        const indexB = players.findIndex(p => p.id === b.id)
        return indexB - indexA 
      })

      const benched = unassignedPlayers.splice(0, numToBench)
      benched.forEach(p => { newInningAssignments[p.id] = 'Bench' })
    }

    unassignedPlayers.sort((a, b) => {
      const aPrefCount = a.preferred_positions?.length || 0
      const bPrefCount = b.preferred_positions?.length || 0
      if (aPrefCount === 0) return 1
      if (bPrefCount === 0) return -1
      return aPrefCount - bPrefCount
    })

    for (let i = unassignedPlayers.length - 1; i >= 0; i--) {
      const p = unassignedPlayers[i]
      const prefs = p.preferred_positions || []

      const sortedPrefs = [...prefs].sort((posA, posB) => {
        const countA = historicalPosCounts[p.id][posA] || 0
        const countB = historicalPosCounts[p.id][posB] || 0
        return countA - countB
      })

      const chosenPos = sortedPrefs.find(pos => availablePositions.includes(pos))
      if (chosenPos) {
        newInningAssignments[p.id] = chosenPos
        availablePositions.splice(availablePositions.indexOf(chosenPos), 1)
        unassignedPlayers.splice(i, 1)
      }
    }

    unassignedPlayers.forEach(p => {
      availablePositions.sort((posA, posB) => {
        const countA = historicalPosCounts[p.id][posA] || 0
        const countB = historicalPosCounts[p.id][posB] || 0
        return countA - countB
      })

      const pos = availablePositions.shift()
      if (pos) {
        newInningAssignments[p.id] = pos
      } else {
        newInningAssignments[p.id] = 'Bench'
      }
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
      const formattedInnings = INNINGS.map(inningNum => ({
        inning: inningNum,
        assignments: assignments[inningNum] || {}
      }))

      // NEW: We UPDATE the game instead of inserting a new one!
      const { error: updateError } = await supabase
        .from('games')
        .update({
          innings: formattedInnings,
          status: 'scheduled'
        })
        .eq('id', id)

      if (updateError) throw updateError

      router.refresh()
      router.push(`/games/${id}`) // Sends you right to the final Lineup Viewer!

    } catch (err: any) {
      console.error('Error saving positions:', err)
      setError(err.message || 'Failed to save positions. Please try again.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const currentInningAssignments = assignments[activeInning] || {}
  const takenPositions = Object.values(currentInningAssignments).filter(pos => pos !== 'Bench')

  return (
    <div className="max-w-3xl mx-auto p-6 w-full pb-24">
      <div className="flex items-center justify-between mb-8">
        <Link href={`/games/new/kicking-order?id=${id}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Order
        </Link>
        <span className="text-sm font-bold text-gray-400">Step 3 of 3</span>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Field Positions</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Assign field positions for each inning.</p>
        </div>
        
        <button
          onClick={handleAutoSetInning}
          className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Auto Set Inning
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mb-8">
        <div className="flex overflow-x-auto border-b border-gray-100 dark:border-gray-800 hide-scrollbar bg-gray-50 dark:bg-gray-900/50">
          {INNINGS.map(inning => (
            <button
              key={inning}
              onClick={() => setActiveInning(inning)}
              className={`flex-1 min-w-[60px] py-4 text-sm font-bold transition-colors border-b-2 ${
                activeInning === inning
                  ? 'border-blue-600 text-blue-600 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Inn {inning}
            </button>
          ))}
        </div>

        <div className="p-2 sm:p-4 divide-y divide-gray-50 dark:divide-gray-800/50">
          {players.map((player, idx) => {
            const currentPosition = currentInningAssignments[player.id] || 'Bench'
            
            const availableOptions = POSITIONS.filter(pos => 
              pos === 'Bench' || pos === currentPosition || !takenPositions.includes(pos)
            )
            
            const showFairPlayWarning = 
              fairPlayEnabled && 
              currentPosition === 'Bench' && 
              benchCounts[player.id] > 1 && 
              unbenchedPlayers.length > 0 &&
              !unbenchedPlayers.some(p => p.id === player.id)
            
            return (
              <div key={player.id} className="p-2 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold flex items-center justify-center text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div className="font-bold text-gray-900 dark:text-white text-sm sm:text-base flex items-center">
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
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' 
                        : showFairPlayWarning 
                          ? 'bg-amber-100 dark:bg-amber-900/20 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {availableOptions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                {showFairPlayWarning && (
                  <div className="mt-2 ml-9 flex items-start gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 p-2 rounded-lg border border-amber-100 dark:border-amber-900/50">
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

      <div className="fixed bottom-20 sm:bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-40">
        <div className="max-w-3xl mx-auto flex justify-end">
          <button
            onClick={handleSaveGame}
            disabled={saving}
            className="w-full sm:w-auto py-3 px-8 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-lg"
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
      </div>
    </div>
  )
}

export default function PositionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-gray-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <PositionsContent />
    </Suspense>
  )
}