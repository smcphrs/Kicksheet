'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2, Shield, Camera, ImagePlus } from 'lucide-react'

export default function NewTeamPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [name, setName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB.')
      return
    }
    
    setError(null)
    setLogoFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedName = name.trim()
    if (!trimmedName) return

    setLoading(true)
    setError(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('You must be logged in to create a team.')

      let logo_url = null

      // Upload Logo if selected
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
  .from('team-logos')
  .upload(filePath, logoFile, {
    cacheControl: '3600',
    upsert: true
  })

        if (uploadError) throw new Error('Failed to upload team logo.')

        const { data: { publicUrl } } = supabase.storage
          .from('team-logos')
          .getPublicUrl(filePath)

        logo_url = publicUrl
      }

      // Insert Team
      const { data: newTeam, error: insertError } = await supabase
        .from('teams')
        .insert([{ 
          name: trimmedName,
          owner_id: user.id,
          logo_url: logo_url
        }])
        .select()
        .single()

      if (insertError) throw insertError

      router.refresh()
      router.push(`/teams/${newTeam.id}`)
      
    } catch (err: any) {
      console.error('Error creating team:', err)
      setError(err.message || 'Failed to create team. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f5f7] to-[#e5e7eb] dark:from-gray-950 dark:to-gray-900 transition-colors">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 pt-12 sm:pt-24 w-full pb-24">
        
        <Link 
          href="/teams" 
          className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Teams
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">Create New Team</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 font-medium text-lg tracking-tight">Give your team a name and logo to start building your roster.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-300 dark:border-gray-700 space-y-8 transition-colors">
          
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold">
              {error}
            </div>
          )}

          {/* Logo Upload Section */}
          <div className="flex items-center gap-5 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden shrink-0 group">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              ) : (
                <ImagePlus className="w-8 h-8 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" />
              )}
              
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>
            
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white">Team Logo <span className="text-gray-400 dark:text-gray-500 font-medium text-sm">(Optional)</span></h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
                Tap the square to upload an image. <br className="hidden sm:block"/>
                JPG, PNG, or WebP. Max 2MB.
              </p>
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-3">
            <label htmlFor="name" className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Team Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The Kickers"
              required
              maxLength={50}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-600/20 font-bold transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-300 dark:border-gray-700">
            <Link
              href="/teams"
              className="px-6 py-3.5 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 font-bold rounded-xl text-center transition-colors border border-gray-300 dark:border-gray-700 active:scale-95"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Create Team'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}