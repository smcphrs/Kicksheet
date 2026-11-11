import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AdminTable } from './AdminTable' // <-- Import the new client component

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // 1. Authenticate the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Verify Admin Status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  // 3. Fetch Global Data using the Admin Client
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
  const { data: teams } = await supabaseAdmin.from('teams').select('id, owner_id')
  const { data: games } = await supabaseAdmin.from('games').select('id, user_id, result')
  
  // 🚨 NEW: Fetch all profiles to get location data
  const { data: allProfiles } = await supabaseAdmin.from('profiles').select('id, location')

  // 4. Aggregate Usage Stats per User
  const userStats = usersData?.users.map(u => {
    const userTeams = teams?.filter(t => t.owner_id === u.id).length || 0
    const userGames = games?.filter(g => g.user_id === u.id).length || 0
    const userProfile = allProfiles?.find(p => p.id === u.id) // <-- Find matching profile
    
    return { 
      id: u.id, 
      email: u.email, 
      created: new Date(u.created_at).toLocaleDateString(), 
      teams: userTeams, 
      games: userGames,
      location: userProfile?.location || 'Unknown' // <-- Attach location
    }
  }) || []

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto min-h-screen pb-24">
      <h1 className="text-3xl font-black tracking-tight mb-8 text-gray-900">Admin Dashboard</h1>
      
      {/* Top Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 bg-blue-50 text-blue-900 rounded-2xl border border-blue-100">
          <h3 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Total Accounts</h3>
          <p className="text-4xl font-black">{usersData?.users.length || 0}</p>
        </div>
        <div className="p-6 bg-green-50 text-green-900 rounded-2xl border border-green-100">
          <h3 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Total Teams</h3>
          <p className="text-4xl font-black">{teams?.length || 0}</p>
        </div>
        <div className="p-6 bg-purple-50 text-purple-900 rounded-2xl border border-purple-100">
          <h3 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Total Games</h3>
          <p className="text-4xl font-black">{games?.length || 0}</p>
        </div>
      </div>

      {/* Interactive User Table Component */}
      <AdminTable users={userStats} />
    </div>
  )
}