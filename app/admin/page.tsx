import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AdminTable } from './AdminTable'
import { ShieldAlert, Users, Trophy, Gamepad2, Activity, PieChart } from 'lucide-react'

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
  const { data: allProfiles } = await supabaseAdmin.from('profiles').select('id, location')

  // 4. Aggregate Usage Stats per User
  const userStats = usersData?.users.map(u => {
    const userTeams = teams?.filter(t => t.owner_id === u.id).length || 0
    const userGames = games?.filter(g => g.user_id === u.id).length || 0
    const userProfile = allProfiles?.find(p => p.id === u.id)
    
    return { 
      id: u.id, 
      email: u.email, 
      created: new Date(u.created_at).toLocaleDateString(), 
      teams: userTeams, 
      games: userGames,
      location: userProfile?.location || 'Unknown'
    }
  }) || []

  // --- DERIVE DATA FOR VISUAL CHARTS ---
  const totalUsers = usersData?.users.length || 0
  const activeUsers = userStats.filter(u => u.teams > 0 || u.games > 0).length
  const inactiveUsers = totalUsers - activeUsers
  const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

  const totalGames = games?.length || 0
  const totalWins = games?.filter(g => g.result === 'W').length || 0
  const totalLosses = games?.filter(g => g.result === 'L').length || 0
  const totalTies = games?.filter(g => g.result === 'T').length || 0
  const totalPending = totalGames - (totalWins + totalLosses + totalTies)

  return (
    <div className="min-h-screen bg-[#f4f5f7] dark:bg-gray-950 transition-colors pb-24">
      
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#0a192f] to-[#1e40af] dark:from-gray-900 dark:to-blue-950 text-white pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-8 border-b border-blue-900 shadow-inner">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-200 text-[10px] sm:text-xs font-black uppercase tracking-widest rounded-full border border-blue-500/30 mb-4 backdrop-blur-sm">
              <ShieldAlert className="w-3.5 h-3.5" /> Super Admin
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">Command Center</h1>
            <p className="text-blue-200/80 font-medium text-sm sm:text-base">Manage platform health, user accounts, and global statistics.</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 -mt-6 sm:-mt-8 space-y-6 sm:space-y-8 relative z-10">
        
        {/* Top Level Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          <div className="group bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-2xl group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors"></div>
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Accounts</h3>
            </div>
            <p className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight relative">{totalUsers}</p>
          </div>

          <div className="group bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full blur-2xl group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors"></div>
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Teams</h3>
            </div>
            <p className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight relative">{teams?.length || 0}</p>
          </div>

          <div className="group bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-purple-500/10 transition-all overflow-hidden relative col-span-2 lg:col-span-1">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-full blur-2xl group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors"></div>
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h3 className="text-xs sm:text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total Games</h3>
            </div>
            <p className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight relative">{totalGames}</p>
          </div>
        </div>

        {/* Data Visualization Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* Engagement Chart */}
          <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" /> Platform Engagement
              </h3>
              <span className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
                {engagementRate}% Active
              </span>
            </div>
            
            {/* Custom CSS Stacked Bar */}
            <div className="w-full h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex mb-4 border border-gray-200 dark:border-gray-700 shadow-inner">
              <div style={{ width: `${engagementRate}%` }} className="h-full bg-blue-500 hover:bg-blue-400 transition-colors relative group cursor-crosshair"></div>
              <div style={{ width: `${100 - engagementRate}%` }} className="h-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors relative group cursor-crosshair"></div>
            </div>
            
            <div className="flex justify-between text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div> Active ({activeUsers})
              </div>
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></div> Dormant ({inactiveUsers})
              </div>
            </div>
          </div>

          {/* Game Results Distribution */}
          <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-500" /> Global Game Results
              </h3>
            </div>
            
            {/* Custom CSS Segmented Bar */}
            <div className="w-full h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex mb-4 border border-gray-200 dark:border-gray-700 shadow-inner">
              {totalGames > 0 ? (
                <>
                  <div style={{ width: `${(totalWins/totalGames)*100}%` }} className="h-full bg-emerald-500 hover:bg-emerald-400 transition-colors" title={`Wins: ${totalWins}`}></div>
                  <div style={{ width: `${(totalLosses/totalGames)*100}%` }} className="h-full bg-rose-500 hover:bg-rose-400 transition-colors" title={`Losses: ${totalLosses}`}></div>
                  <div style={{ width: `${(totalTies/totalGames)*100}%` }} className="h-full bg-slate-500 hover:bg-slate-400 transition-colors" title={`Ties: ${totalTies}`}></div>
                  <div style={{ width: `${(totalPending/totalGames)*100}%` }} className="h-full bg-blue-200 dark:bg-blue-900/40 hover:bg-blue-300 dark:hover:bg-blue-800 transition-colors" title={`Pending: ${totalPending}`}></div>
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700"></div>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] sm:text-xs font-bold">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><div className="w-2.5 h-2.5 rounded bg-emerald-500"></div> {totalWins} W</div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><div className="w-2.5 h-2.5 rounded bg-rose-500"></div> {totalLosses} L</div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300"><div className="w-2.5 h-2.5 rounded bg-slate-500"></div> {totalTies} T</div>
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400"><div className="w-2.5 h-2.5 rounded bg-blue-200 dark:bg-blue-900/40"></div> {totalPending} Pending</div>
            </div>
          </div>

        </div>

        {/* Interactive User Table Component */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Trophy className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-black text-gray-900 dark:text-white">User Directory</h2>
          </div>
          <AdminTable users={userStats} />
        </div>

      </div>
    </div>
  )
}