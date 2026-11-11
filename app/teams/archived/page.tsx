import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Archive, Shield } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function ArchivedTeamsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('owner_id', user.id)
    .eq('is_archived', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-24 sm:px-6 sm:pt-24 w-full space-y-8 sm:space-y-10">
        
        <Link href="/dashboard" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>

        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
              <Archive className="w-8 h-8 text-gray-400" />
              Archived Teams
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium text-lg tracking-tight">Your historical rosters and past seasons.</p>
          </div>
        </header>

        <section>
          <div className="w-full bg-gray-300/60 dark:bg-black/40 border border-blue-400/40 dark:border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center mb-4">
            <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">
              Archived Vault
            </h2>
          </div>
          
          {teams && teams.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {teams.map(team => (
                <Link key={team.id} href={`/teams/${team.id}`} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 group text-center flex flex-col items-center transition-colors overflow-hidden shadow-sm opacity-80 hover:opacity-100">
                  <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center border-b border-gray-200 dark:border-gray-800 overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-300">
                    {team.logo_url ? (
                      <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <span className="text-4xl font-black text-gray-400 dark:text-gray-500 group-hover:scale-110 transition-transform duration-300 uppercase">
                        {team.name ? team.name.charAt(0) : '?'}
                      </span>
                    )}
                  </div>
                  
                  <div className="p-4 w-full flex flex-col items-center">
                    <h3 className="font-extrabold text-gray-900 dark:text-white tracking-tight truncate w-full px-1">{team.name}</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-bold uppercase tracking-widest transition-colors">View Data</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-center transition-colors">
              <Shield className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold tracking-tight mb-1">Your vault is empty.</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs font-medium">Teams you archive will appear here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}