import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Player } from '@/types/models'

export interface GameInfo {
  gameDate: string
  gameTime: string
  opposingTeam: string
  location: string
  field: string
  weather: string
}

interface DraftStore {
  gameInfo: GameInfo | null
  attendingPlayers: string[]
  subs: Player[]
  kickingOrder: string[]
  innings: any[] // Update this to InningAssignment once you port the type
  currentStep: number
  selectedTeamId: string | null
  editingGameId: string | null

  // Actions
  setGameInfo: (info: GameInfo) => void
  setAttendingPlayers: (ids: string[]) => void
  setSubs: (subs: Player[]) => void
  setKickingOrder: (order: string[]) => void
  setInnings: (innings: any[]) => void
  setCurrentStep: (step: number) => void
  setSelectedTeamId: (id: string | null) => void
  setEditingGameId: (id: string | null) => void
  resetDraft: () => void
}

const initialState = {
  gameInfo: null,
  attendingPlayers: [],
  subs: [],
  kickingOrder: [],
  innings: [],
  currentStep: 0,
  selectedTeamId: null,
  editingGameId: null,
}

export const useDraftStore = create<DraftStore>()(
  persist(
    (set) => ({
      ...initialState,
      setGameInfo: (info) => set({ gameInfo: info }),
      setAttendingPlayers: (ids) => set({ attendingPlayers: ids }),
      setSubs: (subs) => set({ subs }),
      setKickingOrder: (order) => set({ kickingOrder: order }),
      setInnings: (innings) => set({ innings }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setSelectedTeamId: (id) => set({ selectedTeamId: id }),
      setEditingGameId: (id) => set({ editingGameId: id }),
      resetDraft: () => set(initialState),
    }),
    {
      name: 'kicksheet-draft-storage', // Instantly auto-saves to browser memory
    }
  )
)