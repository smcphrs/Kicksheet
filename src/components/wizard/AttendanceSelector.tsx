{\rtf1\ansi\ansicpg1252\cocoartf2908
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 'use client'\
\
import \{ useDraftStore \} from '@/store/useDraftStore'\
import \{ Player \} from '@/types/models'\
import \{ CheckCircle2, Circle \} from 'lucide-react'\
\
interface AttendanceSelectorProps \{\
  roster: Player[]\
\}\
\
export default function AttendanceSelector(\{ roster \}: AttendanceSelectorProps) \{\
  const \{ draft, toggleAttendance \} = useDraftStore()\
\
  // Filter to only show active players by default\
  const activePlayers = roster.filter(p => p.status === 'active')\
\
  return (\
    <div className="space-y-4">\
      <div className="flex justify-between items-end mb-6">\
        <div>\
          <h2 className="text-2xl font-bold tracking-tight">Who is playing?</h2>\
          <p className="text-gray-500 text-sm mt-1">Select the players attending this game.</p>\
        </div>\
        <div className="text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">\
          \{draft.attendingPlayers.length\} / \{activePlayers.length\} Attending\
        </div>\
      </div>\
\
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">\
        \{activePlayers.map((player) => \{\
          const isAttending = draft.attendingPlayers.includes(player.id)\
\
          return (\
            <button\
              key=\{player.id\}\
              onClick=\{() => toggleAttendance(player.id)\}\
              className=\{`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left $\{\
                isAttending \
                  ? 'border-blue-600 bg-blue-50' \
                  : 'border-gray-200 bg-white hover:border-blue-200'\
              \}`\}\
            >\
              <div>\
                <p className=\{`font-semibold $\{isAttending ? 'text-blue-900' : 'text-gray-900'\}`\}>\
                  \{player.name\}\
                </p>\
                \{player.number && (\
                  <p className=\{`text-xs mt-0.5 $\{isAttending ? 'text-blue-600/80' : 'text-gray-500'\}`\}>\
                    #\{player.number\}\
                  </p>\
                )\}\
              </div>\
              \
              \{isAttending ? (\
                <CheckCircle2 className="w-6 h-6 text-blue-600" />\
              ) : (\
                <Circle className="w-6 h-6 text-gray-300" />\
              )\}\
            </button>\
          )\
        \})\}\
      </div>\
    </div>\
  )\
\}}