'use client'

import { useState } from 'react'
import { Link2, Check } from 'lucide-react'

export function CopyInviteButton({ teamId }: { teamId: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/join/${teamId}`
    navigator.clipboard.writeText(inviteUrl)
    
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopyInvite}
      className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all active:scale-95 border ${
        copied
          ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-950/20'
          : 'bg-white hover:bg-blue-50 text-[#1e40af] border-white shadow-sm hover:shadow'
      }`}
    >
      {copied ? (
        <Check className="w-4 h-4 mr-1.5 text-white stroke-[2.5]" />
      ) : (
        <Link2 className="w-4 h-4 mr-1.5 text-[#2563eb] stroke-[2.5]" />
      )}
      <span>{copied ? 'Link Copied!' : 'Invite Players'}</span>
    </button>
  )
}