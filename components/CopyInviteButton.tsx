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
      type="button"
      className={`flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-3 sm:py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 border ${
        copied
          ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-950/20'
          : 'bg-white hover:bg-gray-100 text-[#0a192f] border-white shadow-sm'
      }`}
    >
      {copied ? (
        <Check className="w-5 h-5 mr-2 text-white stroke-[2.5]" />
      ) : (
        <Link2 className="w-5 h-5 mr-2 text-[#2563eb] stroke-[2.5]" />
      )}
      <span>{copied ? 'Link Copied!' : 'Invite'}</span>
    </button>
  )
}