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
      className="inline-flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all active:scale-95 group"
    >
      {copied ? (
        <Check className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
      ) : (
        <Link2 className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
      )}
      <span className={copied ? 'text-green-700 dark:text-green-400' : ''}>
        {copied ? 'Link Copied!' : 'Invite Players'}
      </span>
    </button>
  )
}