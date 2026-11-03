import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Shield, Calendar, Users, ArrowRight, Plus, Settings } from 'lucide-react'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch stats for the dashboard
  const [
    { count: teamsCount },
    { count: gamesCount },
    { count: playersCount }
  ] = await Promise.all([
    supabase.from('teams').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('games').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    // To get total players, we'd normally join on teams, but assuming a simple query for now or just getting all players created by this user
    // If your players table has a user_id, use that. Otherwise, we can skip the exact count for players or query via teams.
    supabase.from('players').select('*', { count: 'exact', head: true }) // Adjust if you have RLS filtering players by owner
  ])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-24 sm:px-6 sm:pt-24 w-full space-y-8 sm:space-y-10">
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium text-lg tracking-tight">
              Welcome back! Here's an overview of your teams.
            </p>
          </div>
          
          <div className="flex w-full sm:w-auto gap-3">
            <Link 
              href="/settings"
              className="flex items-center justify-center p-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:scale-95"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <Link 
              href="/games/new"
              className="flex-1 sm:flex-none text-center bg-[#2563eb] text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-bold transition-colors active:scale-95 inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Game
            </Link>
          </div>
        </header>

        {/* Quick Actions / Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Teams Stat Box - Deep Royal Blue (LF) */}
          <Link 
            href="/teams" 
            className="group relative bg-[#1e40af] p-6 sm:p-8 rounded-3xl border border-[#1e40af] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-900/20 active:scale-95 flex flex-col justify-between min-h-[160px]"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="p-3 bg-white/20 rounded-2xl border border-white/20 backdrop-blur-sm text-white">
                <Shield className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <div className="relative z-10 mt-6">
              <h3 className="text-3xl font-black text-white tracking-tight">{teamsCount || 0}</h3>
              <p className="text-blue-100 font-bold tracking-wide mt-1 text-sm uppercase">Active Teams</p>
            </div>
          </Link>

          {/* Games Stat Box - Green (RF) */}
          <Link 
            href="/games" 
            className="group relative bg-[#43a047] p-6 sm:p-8 rounded-3xl border border-[#43a047] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-green-900/20 active:scale-95 flex flex-col justify-between min-h-[160px]"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="p-3 bg-white/20 rounded-2xl border border-white/20 backdrop-blur-sm text-white">
                <Calendar className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <div className="relative z-10 mt-6">
              <h3 className="text-3xl font-black text-white tracking-tight">{gamesCount || 0}</h3>
              <p className="text-green-100 font-bold tracking-wide mt-1 text-sm uppercase">Games Scheduled</p>
            </div>
          </Link>

          {/* Players Stat Box - Orange (2B) */}
          <Link 
            href="/teams" 
            className="group relative bg-[#ff9800] p-6 sm:p-8 rounded-3xl border border-[#ff9800] overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-900/20 active:scale-95 flex flex-col justify-between min-h-[160px]"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>
            <div className="flex justify-between items-start relative z-10">
              <div className="p-3 bg-white/20 rounded-2xl border border-white/20 backdrop-blur-sm text-white">
                <Users className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
            <div className="relative z-10 mt-6">
              <h3 className="text-3xl font-black text-white tracking-tight">{playersCount || 0}</h3>
              <p className="text-orange-100 font-bold tracking-wide mt-1 text-sm uppercase">Total Players</p>
            </div>
          </Link>

        </div>

      </div>
    </div>
  )
}