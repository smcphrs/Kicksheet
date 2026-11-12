'use client'

import { useState } from 'react'
import { Link2, MessageCircle, UserCheck, ArrowRight, ClipboardEdit, ChevronDown } from 'lucide-react'
import { CopyInviteButton } from '@/components/CopyInviteButton'

export function InviteInstructions({ teamId }: { teamId: string }) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col transition-all duration-300">
      
      {/* Header Row - Now stacks on mobile, row on desktop */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div 
          className="flex items-center gap-3 sm:gap-4 cursor-pointer group w-full sm:w-auto"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 group-hover:bg-gray-100 dark:group-hover:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors shrink-0">
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
          <div className="flex flex-col">
            <h2 className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 select-none leading-tight">
              Invite Players
            </h2>
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-0.5 select-none transition-colors group-hover:text-gray-500 dark:group-hover:text-gray-400">
              {isExpanded ? "Hide instructions" : "How does this work?"}
            </p>
          </div>
        </div>
        
        {/* Button container takes full width on mobile */}
        <div className="w-full sm:w-auto shrink-0">
          <CopyInviteButton teamId={teamId} />
        </div>
      </div>

      {/* Visual Step-by-Step Guide - Collapsible */}
      {isExpanded && (
        <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 border-t border-gray-100 dark:border-gray-800 mt-1 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="grid grid-cols-2 lg:flex lg:flex-row gap-4 lg:gap-2 xl:gap-4 items-stretch relative mt-5">
            
            {/* Step 1 */}
            <div className="relative pt-3 lg:flex-1">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#2563eb] text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 z-10 shadow-sm">1</div>
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-xl p-3 pt-6 flex flex-col items-center text-center h-full">
                <Link2 className="w-7 h-7 sm:w-8 sm:h-8 text-[#2563eb] mb-3" />
                <div className="bg-[#2563eb] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 w-full truncate">Copy Link</div>
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium leading-tight">Grab your secure team invite link.</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center pt-3 text-blue-300 dark:text-blue-800"><ArrowRight className="w-5 h-5" /></div>

            {/* Step 2 */}
            <div className="relative pt-3 lg:flex-1">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#2563eb] text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 z-10 shadow-sm">2</div>
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-xl p-3 pt-6 flex flex-col items-center text-center h-full">
                <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-[#2563eb] mb-3" />
                <div className="bg-[#2563eb] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 w-full truncate">Share</div>
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium leading-tight">Send it in your team group chat.</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center pt-3 text-blue-300 dark:text-blue-800"><ArrowRight className="w-5 h-5" /></div>

            {/* Step 3 */}
            <div className="relative pt-3 lg:flex-1">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-[#2563eb] text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 z-10 shadow-sm">3</div>
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-xl p-3 pt-6 flex flex-col items-center text-center h-full">
                <ClipboardEdit className="w-7 h-7 sm:w-8 sm:h-8 text-[#2563eb] mb-3" />
                <div className="bg-[#2563eb] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 w-full truncate">Submit</div>
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium leading-tight">Players fill out a quick profile.</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center justify-center pt-3 text-blue-300 dark:text-blue-800"><ArrowRight className="w-5 h-5" /></div>

            {/* Step 4 */}
            <div className="relative pt-3 lg:flex-1">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 bg-emerald-500 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 z-10 shadow-sm">4</div>
              <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-3 pt-6 flex flex-col items-center text-center h-full">
                <UserCheck className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-500 mb-3" />
                <div className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2 w-full truncate">Auto-Join</div>
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-medium leading-tight">Roster updates automatically.</p>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </section>
  )
}