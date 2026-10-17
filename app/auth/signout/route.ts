{\rtf1\ansi\ansicpg1252\cocoartf2908
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ createClient \} from '@/lib/supabase/server'\
import \{ cookies \} from 'next/headers'\
import \{ NextResponse \} from 'next/server'\
\
export async function POST(request: Request) \{\
  const cookieStore = cookies()\
  const supabase = createClient(cookieStore)\
\
  // Check if a session exists before attempting to sign out\
  const \{ data: \{ session \} \} = await supabase.auth.getSession()\
\
  if (session) \{\
    await supabase.auth.signOut()\
  \}\
\
  // Redirect to the login page after signing out\
  return NextResponse.redirect(new URL('/login', request.url), \{\
    status: 302,\
  \})\
\}}