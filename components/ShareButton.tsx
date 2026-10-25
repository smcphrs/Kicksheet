'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { toBlob } from 'html-to-image'

export default function ShareButton({ 
  targetRef, 
  fileName = 'Lineup.png' 
}: { 
  targetRef: React.RefObject<HTMLElement | null>, 
  fileName?: string 
}) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!targetRef.current) return
    setDownloading(true)
    
    try {
      const blob = await toBlob(targetRef.current, { 
        quality: 1,
        backgroundColor: '#f8f9fa',
        pixelRatio: 2
      })
      
      if (!blob) throw new Error("Failed to generate blob")

      const file = new File([blob], fileName, { type: 'image/png' })

      // Try Mobile Share Sheet first, fallback to Desktop download
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: fileName,
          })
        } catch (shareErr) {
          console.log("User closed share sheet")
        }
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error("Failed to capture image", err)
      alert("Failed to capture image. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button 
      onClick={handleDownload}
      disabled={downloading}
      className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-full shadow-sm hover:bg-blue-700 transition-all disabled:opacity-50"
    >
      {downloading ? (
        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-1.5" />
      )}
      Save Image
    </button>
  )
}