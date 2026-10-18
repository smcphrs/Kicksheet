import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import WizardContainer from '@/components/wizard/WizardContainer'

export default async function NewGamePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // 1. Authenticate the user
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // 2. Fetch the user's team and associated roster
  // Note: We're grabbing the first team they own. If users can manage multiple teams,
  // you might want to read a ?teamId URL parameter here instead.
  const { data: team, error } = await supabase
    .from('teams')
    .select(`
      id,
      players (*)
    `)
    .eq('owner_id', session.user.id)
    .limit(1)
    .single()

  if (error || !team) {
    return (
      <div className="p-8 text-center mt-20">
        <h1 className="text-2xl font-bold text-gray-900">No Team Found</h1>
        <p className="mt-2 text-gray-600">You need to create a team before scheduling a game.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Schedule Game</h1>
          <p className="text-gray-600 mt-1">Draft your lineup and field assignments for game day.</p>
        </div>
        
        {/* Mount the client-side state machine */}
        <WizardContainer teamId={team.id} roster={team.players || []} />
      </div>
    </div>
  )
}