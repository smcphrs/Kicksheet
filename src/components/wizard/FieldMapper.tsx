{\rtf1\ansi\ansicpg1252\cocoartf2908
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 'use client'\
\
import \{ useState \} from 'react'\
import \{ useDraftStore \} from '@/store/useDraftStore'\
import \{ Player, Position \} from '@/types/models'\
import \{ ChevronLeft, ChevronRight, X \} from 'lucide-react'\
\
// Map out the field coordinates (percentages from top-left)\
const FIELD_POSITIONS: \{ id: Position; label: string; top: string; left: string \}[] = [\
  \{ id: 'C', label: 'C', top: '85%', left: '50%' \},\
  \{ id: 'P', label: 'P', top: '55%', left: '50%' \},\
  \{ id: '1B', label: '1B', top: '55%', left: '80%' \},\
  \{ id: '2B', label: '2B', top: '35%', left: '65%' \},\
  \{ id: 'SS', label: 'SS', top: '35%', left: '35%' \},\
  \{ id: '3B', label: '3B', top: '55%', left: '20%' \},\
  \{ id: 'LF', label: 'LF', top: '15%', left: '15%' \},\
  \{ id: 'LCF', label: 'LCF', top: '8%', left: '35%' \},\
  \{ id: 'RCF', label: 'RCF', top: '8%', left: '65%' \},\
  \{ id: 'RF', label: 'RF', top: '15%', left: '85%' \},\
]\
\
export default function FieldMapper(\{ roster \}: \{ roster: Player[] \}) \{\
  const \{ draft, updateInningAssignment \} = useDraftStore()\
  const [currentInning, setCurrentInning] = useState(1)\
  const [selectedPos, setSelectedPos] = useState<Position | null>(null)\
\
  // Get current inning data\
  const currentInningData = draft.innings.find(i => i.inningNumber === currentInning)\
  const assignments = currentInningData?.assignments || []\
\
  // Get attending players for the selection list\
  const attendingPlayers = roster.filter(p => draft.attendingPlayers.includes(p.id))\
\
  const handleAssign = (playerId: string) => \{\
    if (selectedPos) \{\
      updateInningAssignment(currentInning, playerId, selectedPos)\
      setSelectedPos(null)\
    \}\
  \}\
\
  const handleRemove = (position: Position, e: React.MouseEvent) => \{\
    e.stopPropagation()\
    // A quick hack for removal: pass an empty string as the playerId to clear it in the store\
    updateInningAssignment(currentInning, '', position) \
  \}\
\
  return (\
    <div className="space-y-6">\
      <div className="flex justify-between items-center">\
        <div>\
          <h2 className="text-2xl font-bold tracking-tight">Field Positions</h2>\
          <p className="text-gray-500 text-sm mt-1">Assign players for each inning.</p>\
        </div>\
        \
        \{/* Inning Navigation */\}\
        <div className="flex items-center gap-4 bg-gray-100 p-1 rounded-lg">\
          <button \
            onClick=\{() => setCurrentInning(Math.max(1, currentInning - 1))\}\
            className="p-2 rounded-md hover:bg-white hover:shadow-sm disabled:opacity-50"\
            disabled=\{currentInning === 1\}\
          >\
            <ChevronLeft className="w-5 h-5" />\
          </button>\
          <span className="font-semibold w-16 text-center">Inning \{currentInning\}</span>\
          <button \
            onClick=\{() => setCurrentInning(currentInning + 1)\}\
            className="p-2 rounded-md hover:bg-white hover:shadow-sm"\
          >\
            <ChevronRight className="w-5 h-5" />\
          </button>\
        </div>\
      </div>\
\
      \{/* The Field */\}\
      <div className="relative w-full max-w-md mx-auto aspect-square bg-emerald-600 rounded-t-[40%] rounded-b-xl border-4 border-emerald-800 shadow-inner overflow-hidden">\
        \{/* Dirt Diamond Infill (Optional styling flair) */\}\
        <div className="absolute top-[35%] left-[20%] right-[20%] bottom-[15%] bg-amber-700/20 rotate-45 transform origin-center rounded-sm pointer-events-none" />\
\
        \{FIELD_POSITIONS.map((pos) => \{\
          const assignment = assignments.find(a => a.position === pos.id)\
          const player = assignment ? roster.find(p => p.id === assignment.playerId) : null\
\
          return (\
            <div\
              key=\{pos.id\}\
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"\
              style=\{\{ top: pos.top, left: pos.left \}\}\
            >\
              <button\
                onClick=\{() => setSelectedPos(pos.id)\}\
                className=\{`w-12 h-12 flex items-center justify-center rounded-full shadow-md text-sm font-bold border-2 transition-transform hover:scale-105 $\{\
                  player \
                    ? 'bg-blue-600 text-white border-blue-400' \
                    : 'bg-white text-gray-400 border-gray-300 border-dashed'\
                \}`\}\
              >\
                \{player ? player.number || player.name.charAt(0) : pos.label\}\
              </button>\
              \{player && (\
                <div className="mt-1 bg-white/90 px-2 py-0.5 rounded text-[10px] font-semibold text-gray-800 shadow-sm flex items-center gap-1">\
                  <span className="truncate max-w-[50px]">\{player.name\}</span>\
                  <X \
                    className="w-3 h-3 text-red-500 cursor-pointer" \
                    onClick=\{(e) => handleRemove(pos.id, e)\} \
                  />\
                </div>\
              )\}\
            </div>\
          )\
        \})\}\
      </div>\
\
      \{/* Player Selection Modal/Drawer */\}\
      \{selectedPos && (\
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">\
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl max-h-[80vh] flex flex-col">\
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">\
              <h3 className="font-semibold">Assign \{selectedPos\}</h3>\
              <button onClick=\{() => setSelectedPos(null)\} className="p-1 hover:bg-gray-200 rounded-full">\
                <X className="w-5 h-5" />\
              </button>\
            </div>\
            <div className="p-2 overflow-y-auto">\
              \{attendingPlayers.map(player => \{\
                const isAssignedElsewhere = assignments.some(a => a.playerId === player.id)\
                return (\
                  <button\
                    key=\{player.id\}\
                    onClick=\{() => handleAssign(player.id)\}\
                    className="w-full text-left p-3 hover:bg-blue-50 rounded-xl flex justify-between items-center"\
                  >\
                    <div>\
                      <span className="font-medium">\{player.name\}</span>\
                      \{player.number && <span className="text-gray-500 text-sm ml-2">#\{player.number\}</span>\}\
                    </div>\
                    \{isAssignedElsewhere && (\
                      <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded font-medium">\
                        Already playing\
                      </span>\
                    )\}\
                  </button>\
                )\
              \})\}\
            </div>\
          </div>\
        </div>\
      )\}\
    </div>\
  )\
\}}