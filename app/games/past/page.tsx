{\rtf1\ansi\ansicpg1252\cocoartf2908
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ createClient \} from '@/lib/supabase/server'\
import \{ cookies \} from 'next/headers'\
import \{ redirect \} from 'next/navigation'\
import Link from 'next/link'\
import \{ Calendar, MapPin, Clock \} from 'lucide-react'\
\
export default async function PastGamesPage() \{\
  const cookieStore = cookies()\
  const supabase = createClient(cookieStore)\
\
  const \{ data: \{ session \} \} = await supabase.auth.getSession()\
\
  if (!session) \{\
    redirect('/login')\
  \}\
\
  // Fetch the user's teams to get their IDs\
  const \{ data: teams \} = await supabase\
    .from('teams')\
    .select('id, name')\
    .eq('owner_id', session.user.id)\
\
  const teamIds = teams?.map(t => t.id) || []\
\
  // Fetch the games for those teams\
  const \{ data: games, error \} = await supabase\
    .from('game_lineups')\
    .select('*')\
    .in('team_id', teamIds)\
    .order('game_date', \{ ascending: false \})\
    .order('game_time', \{ ascending: false \})\
\
  if (error || !games?.length) \{\
    return (\
      <div className="max-w-4xl mx-auto p-8 text-center mt-12 bg-white rounded-2xl shadow-sm border border-gray-100">\
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">No Games Found</h2>\
        <p className="text-gray-600 mb-6">You haven't scheduled or played any games yet.</p>\
        <Link \
          href="/games/new" \
          className="inline-flex bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"\
        >\
          Schedule a Game\
        </Link>\
      </div>\
    )\
  \}\
\
  return (\
    <div className="max-w-4xl mx-auto p-6 space-y-8 w-full">\
      <header className="mb-8">\
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Scheduled & Past Games</h1>\
        <p className="text-gray-600 mt-1">Review your historical lineups and upcoming matches.</p>\
      </header>\
\
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">\
        \{games.map((game) => \{\
          const teamName = teams?.find(t => t.id === game.team_id)?.name || 'Your Team'\
          \
          return (\
            <Link href=\{`/games/$\{game.id\}`\} key=\{game.id\}>\
              <div className="p-5 border rounded-xl shadow-sm bg-white hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group">\
                <div className="flex justify-between items-start mb-4">\
                  <div>\
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">\
                      vs. \{game.opposing_team || 'TBD'\}\
                    </h3>\
                    <p className="text-sm text-gray-500 font-medium">\{teamName\}</p>\
                  </div>\
                </div>\
                \
                <div className="space-y-2 text-sm text-gray-600">\
                  <div className="flex items-center gap-2">\
                    <Calendar className="w-4 h-4 text-gray-400" />\
                    <span>\{new Date(game.game_date).toLocaleDateString('en-US', \{ weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' \})\}</span>\
                  </div>\
                  <div className="flex items-center gap-2">\
                    <Clock className="w-4 h-4 text-gray-400" />\
                    <span>\{game.game_time\}</span>\
                  </div>\
                  \{(game.location || game.field) && (\
                    <div className="flex items-center gap-2">\
                      <MapPin className="w-4 h-4 text-gray-400" />\
                      <span>\{[game.location, game.field].filter(Boolean).join(' - ')\}</span>\
                    </div>\
                  )\}\
                </div>\
              </div>\
            </Link>\
          )\
        \})\}\
      </div>\
    </div>\
  )\
\}}