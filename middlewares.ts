{\rtf1\ansi\ansicpg1252\cocoartf2908
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import \{ createServerClient, type CookieOptions \} from '@supabase/ssr'\
import \{ NextResponse, type NextRequest \} from 'next/server'\
\
export async function middleware(request: NextRequest) \{\
  let response = NextResponse.next(\{\
    request: \{\
      headers: request.headers,\
    \},\
  \})\
\
  const supabase = createServerClient(\
    process.env.NEXT_PUBLIC_SUPABASE_URL!,\
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,\
    \{\
      cookies: \{\
        get(name: string) \{\
          return request.cookies.get(name)?.value\
        \},\
        set(name: string, value: string, options: CookieOptions) \{\
          request.cookies.set(\{ name, value, ...options \})\
          response = NextResponse.next(\{\
            request: \{ headers: request.headers \},\
          \})\
          response.cookies.set(\{ name, value, ...options \})\
        \},\
        remove(name: string, options: CookieOptions) \{\
          request.cookies.set(\{ name, value: '', ...options \})\
          response = NextResponse.next(\{\
            request: \{ headers: request.headers \},\
          \})\
          response.cookies.set(\{ name, value: '', ...options \})\
        \},\
      \},\
    \}\
  )\
\
  await supabase.auth.getSession()\
\
  return response\
\}\
\
export const config = \{\
  matcher: [\
    '/((?!_next/static|_next/image|favicon.ico|.*\\\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',\
  ],\
\}}