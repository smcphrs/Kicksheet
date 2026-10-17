'use client'

import { useState } from 'react'
import { Share, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'

export default function ShareButton({ targetId }: { targetId: string }) {
  const [isSharing, setIsSharing] = useState(false)

  const handleShare = async () => {
    const element = document.getElementById(targetId)
    if (!element) return

    setIsSharing(true)
    try {
      // Capture the DOM element as an image
      const canvas = await html2canvas(element, { 
        scale: 2, // Higher resolution
        useCORS: true,
        backgroundColor: '#f9fafb' // Match gray-50 background
      })
      
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('Failed to generate image')

      const file = new File([blob], 'kicksheet-lineup.png', { type: 'image/png' })

      // Check if the device supports the native Web Share API with files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Game Lineup',
          text: 'Here is the lineup for our upcoming game!',
          files: [file]
        })
      } else {
        // Fallback: Download the image for desktop users
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'kicksheet-lineup.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error sharing lineup:', error)
      alert('Failed to generate lineup image.')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-70 shadow-sm"
    >
      {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share className="w-4 h-4" />}
      {isSharing ? 'Generating...' : 'Share Lineup'}
    </button>
  )
}