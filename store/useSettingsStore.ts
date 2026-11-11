import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  fairPlayEnabled: boolean
  setFairPlayEnabled: (enabled: boolean) => void
  inningsCount: number
  setInningsCount: (count: number) => void
  askForJerseyNumbers: boolean 
  setAskForJerseyNumbers: (ask: boolean) => void 
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      fairPlayEnabled: true, // On by default
      setFairPlayEnabled: (enabled) => set({ fairPlayEnabled: enabled }),
      inningsCount: 7, // 7 Innings by default
      setInningsCount: (count) => set({ inningsCount: count }),
      askForJerseyNumbers: true, // <-- DEFAULT TO TRUE
      setAskForJerseyNumbers: (ask) => set({ askForJerseyNumbers: ask }),
    }),
    {
      name: 'kicksheet-settings',
    }
  )
)