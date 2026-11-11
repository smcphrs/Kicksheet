export function generateLineup(roster: any[], numInnings: number = 7) {
  if (!roster || roster.length === 0) return { kicking_order: [], innings: [] }

  // ---------------------------------------------------------
  // 1. GENERATE KICKING ORDER (Mix Experience Levels)
  // ---------------------------------------------------------
  // We want to avoid grouping all beginners together. 
  // This splits the roster and "zips" them together alternating.
  const experienced = roster.filter(p => p.experience_level === 'Experienced').sort(() => 0.5 - Math.random())
  const beginners = roster.filter(p => p.experience_level !== 'Experienced').sort(() => 0.5 - Math.random())
  
  const kickingOrder: string[] = []
  while (experienced.length > 0 || beginners.length > 0) {
    if (experienced.length > 0) kickingOrder.push(experienced.shift()!.id)
    if (beginners.length > 0) kickingOrder.push(beginners.shift()!.id)
  }

  // ---------------------------------------------------------
  // 2. GENERATE INNINGS & POSITIONS
  // ---------------------------------------------------------
  const innings = []
  const sitCounts: Record<string, number> = {}
  roster.forEach(p => (sitCounts[p.id] = 0))

  // Order of importance when filling the field
  const FIELD_POSITIONS = ['P', '1B', 'SS', 'LC', 'RC', '3B', '2B', 'LF', 'RF', 'C']
  const MAX_ON_FIELD = 10

  for (let i = 1; i <= numInnings; i++) {
    const assignments: Record<string, string> = {}
    let availablePlayers = [...roster]

    // --- A. Handle the Bench (Fair Play Rotation) ---
    if (availablePlayers.length > MAX_ON_FIELD) {
      // Sort players by who has sat the LEAST. Break ties randomly so the same people don't always sit together.
      availablePlayers.sort((a, b) => {
        if (sitCounts[a.id] === sitCounts[b.id]) return 0.5 - Math.random()
        return sitCounts[a.id] - sitCounts[b.id]
      })
      
      const numToSit = availablePlayers.length - MAX_ON_FIELD
      const benched = availablePlayers.splice(0, numToSit) // Remove them from available fielders
      
      benched.forEach(p => {
        assignments[p.id] = 'Bench'
        sitCounts[p.id]++
      })
    }

    // --- B. Handle the Field (Position Matching) ---
    let unassignedPlayers = [...availablePlayers]

    // First pass: Try to give players one of their preferred positions
    FIELD_POSITIONS.forEach(pos => {
      if (unassignedPlayers.length === 0) return

      // Look for a player who requested this exact position
      const preferredIdx = unassignedPlayers.findIndex(p => p.positions?.includes(pos))
      
      if (preferredIdx !== -1) {
        const [p] = unassignedPlayers.splice(preferredIdx, 1)
        assignments[p.id] = pos
      }
    })

    // Second pass: Fill remaining empty positions with whoever is left
    FIELD_POSITIONS.forEach(pos => {
      // Check if position is still empty and we have players left
      if (!Object.values(assignments).includes(pos) && unassignedPlayers.length > 0) {
        const [p] = unassignedPlayers.splice(0, 1)
        assignments[p.id] = pos
      }
    })

    // Safety catch: If you play with more than 10 on the field (rovers), mark extras as outfielders
    unassignedPlayers.forEach((p, idx) => {
      assignments[p.id] = `Rover ${idx + 1}`
    })

    innings.push({
      inning: i,
      assignments
    })
  }

  return {
    kicking_order: kickingOrder,
    innings: innings
  }
}