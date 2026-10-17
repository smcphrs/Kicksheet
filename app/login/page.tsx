{\rtf1\ansi\ansicpg1252\cocoartf2908
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 'use client'\
\
import \{ useState \} from 'react'\
import \{ createClient \} from '@/lib/supabase/client'\
import \{ useRouter \} from 'next/navigation'\
import \{ Loader2 \} from 'lucide-react'\
\
export default function LoginPage() \{\
  const [email, setEmail] = useState('')\
  const [password, setPassword] = useState('')\
  const [isLogin, setIsLogin] = useState(true)\
  const [loading, setLoading] = useState(false)\
  const [error, setError] = useState<string | null>(null)\
  \
  const router = useRouter()\
  const supabase = createClient()\
\
  const handleAuth = async (e: React.FormEvent) => \{\
    e.preventDefault()\
    setLoading(true)\
    setError(null)\
\
    if (isLogin) \{\
      const \{ error \} = await supabase.auth.signInWithPassword(\{ email, password \})\
      if (error) \{\
        setError(error.message)\
      \} else \{\
        router.push('/dashboard')\
        router.refresh()\
      \}\
    \} else \{\
      const \{ error \} = await supabase.auth.signUp(\{ \
        email, \
        password,\
        options: \{\
          data: \{\
            full_name: email.split('@')[0] // Fallback display name for new users\
          \}\
        \}\
      \})\
      if (error) \{\
        setError(error.message)\
      \} else \{\
        alert('Check your email for the confirmation link!')\
        setIsLogin(true)\
        setPassword('')\
      \}\
    \}\
    setLoading(false)\
  \}\
\
  return (\
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">\
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border">\
        <div className="text-center">\
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">\
            \{isLogin ? 'Welcome back' : 'Create an account'\}\
          </h2>\
          <p className="mt-2 text-sm text-gray-600">\
            \{isLogin ? 'Sign in to manage your Kicksheet roster.' : 'Sign up to start managing your team.'\}\
          </p>\
        </div>\
\
        <form className="mt-8 space-y-6" onSubmit=\{handleAuth\}>\
          <div className="space-y-4">\
            <div>\
              <label className="block text-sm font-medium text-gray-700">Email address</label>\
              <input\
                type="email"\
                required\
                value=\{email\}\
                onChange=\{(e) => setEmail(e.target.value)\}\
                className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"\
                placeholder="coach@example.com"\
              />\
            </div>\
            <div>\
              <label className="block text-sm font-medium text-gray-700">Password</label>\
              <input\
                type="password"\
                required\
                value=\{password\}\
                onChange=\{(e) => setPassword(e.target.value)\}\
                className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"\
                placeholder="\'95\'95\'95\'95\'95\'95\'95\'95"\
              />\
            </div>\
          </div>\
\
          \{error && (\
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg font-medium">\
              \{error\}\
            </div>\
          )\}\
\
          <button\
            type="submit"\
            disabled=\{loading\}\
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-colors"\
          >\
            \{loading && <Loader2 className="w-4 h-4 animate-spin" />\}\
            \{isLogin ? 'Sign In' : 'Sign Up'\}\
          </button>\
        </form>\
\
        <div className="text-center mt-4">\
          <button\
            onClick=\{() => setIsLogin(!isLogin)\}\
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"\
          >\
            \{isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"\}\
          </button>\
        </div>\
      </div>\
    </div>\
  )\
\}}