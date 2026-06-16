'use client'

import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { CURRICULUM } from '@/lib/curriculum'

const GROUPS = [
  { label: 'Foundation', color: '#1E8449', tiers: ['Coding Explorers', 'Junior Coders'] },
  { label: 'Robotics',   color: '#1A5276', tiers: ['Robotics Junior', 'Robotics Advanced'] },
  { label: 'Creative',   color: '#6C3483', tiers: ['Creative Junior', 'Creative Advanced'] },
  { label: 'Specialist', color: '#117A65', tiers: ['Specialist Junior', 'Specialist Advanced'] },
]

export function CurriculumMindmap() {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(GROUPS.map(g => g.label)))
  const [openTiers, setOpenTiers] = useState<Set<string>>(new Set())

  function toggleGroup(label: string) {
    setOpenGroups(prev => {
      const s = new Set(prev)
      if (s.has(label)) { s.delete(label) } else { s.add(label) }
      return s
    })
  }
  function toggleTier(tier: string) {
    setOpenTiers(prev => {
      const s = new Set(prev)
      if (s.has(tier)) { s.delete(tier) } else { s.add(tier) }
      return s
    })
  }

  return (
    <div className="space-y-3">
      {GROUPS.map(group => {
        const isOpen = openGroups.has(group.label)
        const totalModules = group.tiers.reduce((a, t) => a + (CURRICULUM[t]?.length ?? 0), 0)

        return (
          <div key={group.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Category row */}
            <button
              onClick={() => toggleGroup(group.label)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                style={{ background: group.color }}>
                {group.label[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{group.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {group.tiers.length} tiers · {totalModules} modules total
                </p>
              </div>
              <ChevronRight
                className="w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200"
                style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
              />
            </button>

            {/* Tier tree */}
            {isOpen && (
              <div className="pb-4 px-5">
                {/* Vertical branch line */}
                <div className="ml-5 pl-6 border-l-2 space-y-1" style={{ borderColor: group.color + '55' }}>
                  {group.tiers.map((tier, tierIdx) => {
                    const modules = CURRICULUM[tier] ?? []
                    const tierOpen = openTiers.has(tier)
                    const isLast = tierIdx === group.tiers.length - 1

                    return (
                      <div key={tier}>
                        {/* Tier row with horizontal connector */}
                        <div className="relative">
                          {/* Horizontal branch */}
                          <div className="absolute -left-6 top-1/2 w-5 border-t-2 -translate-y-0.5"
                            style={{ borderColor: group.color + '55' }} />

                          <button
                            onClick={() => toggleTier(tier)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                          >
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: group.color }} />
                            <span className="flex-1 text-sm font-semibold text-gray-800">{tier}</span>
                            <span className="text-xs text-gray-400 tabular-nums">{modules.length} modules</span>
                            <ChevronRight
                              className="w-3.5 h-3.5 text-gray-300 shrink-0 transition-transform duration-200"
                              style={{ transform: tierOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
                            />
                          </button>
                        </div>

                        {/* Modules list */}
                        {tierOpen && (
                          <div
                            className="ml-7 my-1.5 pl-5 space-y-1 border-l-2"
                            style={{ borderColor: group.color + '33' }}
                          >
                            {modules.map((mod, idx) => (
                              <div key={idx} className="relative flex items-start gap-2.5 py-1">
                                {/* Horizontal connector */}
                                <div className="absolute -left-5 top-1/2 w-4 border-t border-dashed -translate-y-0.5"
                                  style={{ borderColor: group.color + '55' }} />
                                <span
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 mt-0.5"
                                  style={{ background: group.color }}
                                >
                                  {idx + 1}
                                </span>
                                <span className="text-sm text-gray-600 leading-snug">{mod}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Spacer if not last */}
                        {!isLast && <div className="h-1" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
