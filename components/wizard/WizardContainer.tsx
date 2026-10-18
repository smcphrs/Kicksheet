'use client'

import { useState } from 'react'
import { useDraftStore } from '@/store/useDraftStore'
import { createClient } from '@/utils/supabase/client'
import { Player } from '@/types/models'
import { ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react'

import GameDetailsForm from './GameDetailsForm'
import AttendanceSelector from './AttendanceSelector'
import KickingOrder from './KickingOrder'
import FieldMapper from './FieldMapper'

interface WizardContainerProps {
  teamId: string
  roster: Player[]
}

export default function WizardContainer({ teamId, roster }: WizardContainerProps) {
  const { draft, setStep, resetDraft } = useDraftStore()
  const [isSaving, setIsSaving] = useState(false)
  const supabase = createClient()

  const handleNext = () => setStep(draft.step + 1)
  const handleBack = () => setStep(draft.step - 1)

  const handleSave = async () => {
    if (!draft.gameInfo?.gameDate || !draft.gameInfo?.gameTime) {
      alert('Please provide at least a Date and Time for the game.')
      setStep(1)
      return
    }

    setIsSaving(true)

    const payload = {
      team_id: teamId,
      game_date: draft.gameInfo.gameDate,
      game_time: draft.gameInfo.gameTime,
      opposing_team: draft.gameInfo.opposingTeam || null,
      location: draft.gameInfo.location || null,
      field: draft.gameInfo.field || null,
      weather: draft.gameInfo.weather || null,
      kicking_order: draft.kickingOrder,
      subs: draft.subs,
      innings: draft.innings
    }

    const { error } = await supabase.from('game_lineups').insert([payload])

    setIsSaving(false)

    if (error) {
      console.error('Error saving game:', error)
      alert('Failed to save the game. Please try again.')
    } else {
      alert('Game saved successfully!')
      resetDraft()
      // You can also trigger a router.push('/dashboard') here to redirect the user
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white rounded-2xl shadow-sm border mt-8">
      {/* Progress Bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4].map((stepIdx) => (
          <div 
            key={stepIdx} 
            className={`h-2 flex-1 rounded-full ${
              stepIdx <= draft.step ? 'bg-blue-600' : 'bg-gray-100'
            } transition-colors duration-300`} 
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {draft.step === 1 && <GameDetailsForm />}
        {draft.step === 2 && <AttendanceSelector roster={roster} />}
        {draft.step === 3 && <KickingOrder roster={roster} />}
        {draft.step === 4 && <FieldMapper roster={roster} />}
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 pt-6 border-t flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={draft.step === 1 || isSaving}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {draft.step < 4 ? (
          <button
            onClick={handleNext}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save Game'}
          </button>
        )}
      </div>
    </div>
  )
}