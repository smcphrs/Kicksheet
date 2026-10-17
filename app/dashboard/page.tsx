{\rtf1\ansi\ansicpg1252\cocoartf2908
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ createClient \} from '@/lib/supabase/server'\
import \{ cookies \} from 'next/headers'\
import Link from 'next/link'\
import \{ Player \} from '@/types/models'\
import \{ Pencil \} from 'lucide-react'\
\
export default async function Dashboard() \{\
  const cookieStore = cookies()\
  const supabase = createClient(cookieStore)\
\
  const \{ data: teams, error \} = await supabase\
    .from('teams')\
    .select(`*, players (*)`)\
    .order('created_at', \{ ascending: false \})\
\
  if (error || !teams?.length) \{\
    return (\
      <div className="max-w-4xl mx-auto p-8 text-center mt-12 bg-white rounded-2xl shadow-sm border border-gray-100">\
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">Welcome to Kicksheet!</h2>\
        <p className="text-gray-600 mb-6">You don't have any teams yet. Create one to get started building your roster.</p>\
        <a \
          href="/teams/new" \
          className="inline-flex bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"\
        >\
          Create Your First Team\
        </a>\
      </div>\
    )\
  \}\
\
  const activeTeam = teams[0]\
  // Sort players: active first, then alphabetically\
  const sortedPlayers = [...(activeTeam.players || [])].sort((a, b) => \{\
    if (a.status === 'active' && b.status !== 'active') return -1\
    if (a.status !== 'active' && b.status === 'active') return 1\
    return a.name.localeCompare(b.name)\
  \})\
\
  return (\
    <div className="max-w-4xl mx-auto p-6 space-y-8 w-full">\
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">\
        <h1 className="text-3xl font-bold tracking-tight">\{activeTeam.name\} Roster</h1>\
        <div className="flex gap-3 w-full sm:w-auto">\
          <a \
            href=\{`/players/new?teamId=$\{activeTeam.id\}`\}\
            className="flex-1 sm:flex-none text-center bg-white text-gray-700 border px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors"\
          >\
            Add Player\
          </a>\
          <a \
            href="/games/new"\
            className="flex-1 sm:flex-none text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"\
          >\
            + New Game\
          </a>\
        </div>\
      </header>\
\
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">\
        \{sortedPlayers.map((player: Player) => (\
          <div \
            key=\{player.id\} \
            className=\{`p-4 border rounded-xl shadow-sm relative group transition-all $\{\
              player.status === 'archived' ? 'bg-gray-50 opacity-75' : 'bg-white'\
            \}`\}\
          >\
            <Link \
              href=\{`/players/$\{player.id\}/edit`\} \
              className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 p-1 bg-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"\
            >\
              <Pencil className="w-4 h-4" />\
            </Link>\
            \
            <div className="pr-8">\
              <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">\
                \{player.name\}\
                \{player.status === 'archived' && (\
                  <span className="text-[10px] uppercase tracking-wider bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">\
                    Archived\
                  </span>\
                )\}\
              </h3>\
              <p className="text-gray-500 text-sm mt-0.5">Number: \{player.number || 'N/A'\}</p>\
            </div>\
            \
            <div className="mt-3 flex flex-wrap gap-1.5">\
              \{player.preferred_positions?.map(pos => (\
                <span key=\{pos\} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold border border-gray-200">\
                  \{pos\}\
                </span>\
              ))\}\
            </div>\
          </div>\
        ))\}\
        \{sortedPlayers.length === 0 && (\
          <div className="col-span-full p-8 text-center border-2 border-dashed rounded-xl text-gray-500 bg-gray-50">\
            No players on this team yet.\
          </div>\
        )\}\
      </div>\
    </div>\
  )\
\}}