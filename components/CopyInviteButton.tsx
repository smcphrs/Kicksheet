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
      className={`inline-flex items-center justify-center px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all active:scale-95 shrink-0 ${
        copied
          ? 'bg-emerald-500 border border-emerald-400 text-white shadow-sm'
          : 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-sm'
      }`}
    >
      {copied ? (
        <Check className="w-4 h-4 mr-2 text-white stroke-[2.5]" />
      ) : (
        <Link2 className="w-4 h-4 mr-2 text-white stroke-[2.5]" />
      )}
      <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
    </button>
  )
}