{\rtf1\ansi\ansicpg1252\cocoartf2908
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ create \} from 'zustand'\
import \{ persist \} from 'zustand/middleware'\
import \{ GameDraft, Position \} from '@/types/models'\
\
interface DraftState \{\
  draft: GameDraft\
  setStep: (step: number) => void\
  setGameInfo: (info: GameDraft['gameInfo']) => void\
  toggleAttendance: (playerId: string) => void\
  setKickingOrder: (order: string[]) => void\
  updateInningAssignment: (inning: number, playerId: string, position: Position) => void\
  resetDraft: () => void\
\}\
\
const initialDraft: GameDraft = \{\
  savedAt: new Date().toISOString(),\
  step: 1,\
  gameInfo: null,\
  attendingPlayers: [],\
  subs: [],\
  kickingOrder: [],\
  innings: []\
\}\
\
export const useDraftStore = create<DraftState>()(\
  persist(\
    (set) => (\{\
      draft: initialDraft,\
      \
      setStep: (step) => set((state) => (\{ \
        draft: \{ ...state.draft, step, savedAt: new Date().toISOString() \} \
      \})),\
\
      setGameInfo: (gameInfo) => set((state) => (\{ \
        draft: \{ ...state.draft, gameInfo, savedAt: new Date().toISOString() \} \
      \})),\
\
      toggleAttendance: (playerId) => set((state) => \{\
        const isAttending = state.draft.attendingPlayers.includes(playerId)\
        \
        // If a player is marked as not attending, we filter them out.\
        // (In a full app, you might also want to filter them out of kickingOrder and innings here)\
        return \{\
          draft: \{\
            ...state.draft,\
            attendingPlayers: isAttending \
              ? state.draft.attendingPlayers.filter(id => id !== playerId)\
              : [...state.draft.attendingPlayers, playerId],\
            savedAt: new Date().toISOString()\
          \}\
        \}\
      \}),\
\
      setKickingOrder: (kickingOrder) => set((state) => (\{\
        draft: \{ ...state.draft, kickingOrder, savedAt: new Date().toISOString() \}\
      \})),\
\
      updateInningAssignment: (inningNum, playerId, position) => set((state) => \{\
        const newInnings = [...state.draft.innings]\
        const inningIndex = newInnings.findIndex(i => i.inningNumber === inningNum)\
        \
        // If the inning hasn't been created in state yet, initialize it\
        if (inningIndex === -1) \{\
          if (playerId === '') return state // Nothing to remove\
          \
          newInnings.push(\{\
            inningNumber: inningNum,\
            assignments: [\{ playerId, position \}]\
          \})\
          \
          return \{ draft: \{ ...state.draft, innings: newInnings, savedAt: new Date().toISOString() \} \}\
        \}\
\
        // Clone the existing inning to mutate it\
        const currentInning = \{ ...newInnings[inningIndex] \}\
        let assignments = [...currentInning.assignments]\
\
        // 1. Remove any existing assignment at this specific position\
        assignments = assignments.filter(a => a.position !== position)\
\
        if (playerId !== '') \{\
          // 2. Remove this player from any OTHER position in this inning\
          // (a player cannot play 1B and CF at the same time)\
          assignments = assignments.filter(a => a.playerId !== playerId)\
          \
          // 3. Assign the player to the new position\
          assignments.push(\{ playerId, position \})\
        \}\
\
        currentInning.assignments = assignments\
        newInnings[inningIndex] = currentInning\
\
        return \{ draft: \{ ...state.draft, innings: newInnings, savedAt: new Date().toISOString() \} \}\
      \}),\
\
      resetDraft: () => set(\{ draft: initialDraft \})\
    \}),\
    \{\
      name: 'kicksheet-game-draft', // localStorage key\
    \}\
  )\
)}