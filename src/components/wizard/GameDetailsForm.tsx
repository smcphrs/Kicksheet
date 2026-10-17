{\rtf1\ansi\ansicpg1252\cocoartf2908
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 'use client'\
\
import \{ useDraftStore \} from '@/store/useDraftStore'\
\
export default function GameDetailsForm() \{\
  const \{ draft, setGameInfo \} = useDraftStore()\
  const info = draft.gameInfo || \{\
    gameDate: '',\
    gameTime: '',\
    opposingTeam: '',\
    location: '',\
    field: '',\
    weather: ''\
  \}\
\
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => \{\
    setGameInfo(\{ ...info, [e.target.name]: e.target.value \})\
  \}\
\
  return (\
    <div className="space-y-6">\
      <div className="mb-6">\
        <h2 className="text-2xl font-bold tracking-tight">Game Details</h2>\
        <p className="text-gray-500 text-sm mt-1">Set the time, location, and opponent.</p>\
      </div>\
\
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">\
        <div className="space-y-2">\
          <label className="text-sm font-medium text-gray-700">Date</label>\
          <input\
            type="date"\
            name="gameDate"\
            value=\{info.gameDate\}\
            onChange=\{handleChange\}\
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"\
          />\
        </div>\
        <div className="space-y-2">\
          <label className="text-sm font-medium text-gray-700">Time</label>\
          <input\
            type="time"\
            name="gameTime"\
            value=\{info.gameTime\}\
            onChange=\{handleChange\}\
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"\
          />\
        </div>\
        <div className="space-y-2">\
          <label className="text-sm font-medium text-gray-700">Opposing Team</label>\
          <input\
            type="text"\
            name="opposingTeam"\
            value=\{info.opposingTeam\}\
            onChange=\{handleChange\}\
            placeholder="e.g. The Kickaholics"\
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"\
          />\
        </div>\
        <div className="space-y-2">\
          <label className="text-sm font-medium text-gray-700">Location / Park</label>\
          <input\
            type="text"\
            name="location"\
            value=\{info.location\}\
            onChange=\{handleChange\}\
            placeholder="e.g. Centennial Park"\
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"\
          />\
        </div>\
        <div className="space-y-2">\
          <label className="text-sm font-medium text-gray-700">Field Number</label>\
          <input\
            type="text"\
            name="field"\
            value=\{info.field\}\
            onChange=\{handleChange\}\
            placeholder="e.g. Field 4"\
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"\
          />\
        </div>\
        <div className="space-y-2">\
          <label className="text-sm font-medium text-gray-700">Weather (Optional)</label>\
          <input\
            type="text"\
            name="weather"\
            value=\{info.weather\}\
            onChange=\{handleChange\}\
            placeholder="e.g. 75\'b0 and Sunny"\
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"\
          />\
        </div>\
      </div>\
    </div>\
  )\
\}}