import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  fairPlayEnabled: boolean
  setFairPlayEnabled: (enabled: boolean) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      fairPlayEnabled: true, // On by default
      setFairPlayEnabled: (enabled) => set({ fairPlayEnabled: enabled }),
    }),
    {
      name: 'kicksheet-settings', // Auto-saves to browser memory
    }
  )
)