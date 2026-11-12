'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, QrCode, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export function CopyInviteButton({ teamId }: { teamId: string }) {
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')

  // Ensure window is defined (client-side only) to get the correct origin URL
  useEffect(() => {
    setInviteUrl(`${window.location.origin}/invite/${teamId}`)
  }, [teamId])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center px-5 py-3 sm:py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 gap-2 w-full sm:w-auto"
      >
        <QrCode className="w-4 h-4" />
        Share Invite
      </button>

      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col items-center relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            
            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight mb-1">Team Invite</h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-6 leading-tight">
              Have players scan this code on the field to instantly join the roster.
            </p>

            {/* QR Code Container - Always white so it scans reliably on dark mode */}
            <div className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm mb-6 w-full flex justify-center">
              <QRCodeSVG 
                value={inviteUrl} 
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            {/* Fallback Copy Link */}
            <div className="w-full flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex-1 truncate px-2 text-xs font-medium text-gray-500 dark:text-gray-400 select-all">
                {inviteUrl}
              </div>
              <button 
                onClick={handleCopy}
                className="shrink-0 inline-flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white text-xs font-bold rounded-lg transition-colors active:scale-95 shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}