'use client'

import { useState } from 'react'
import { LayoutGrid, GitBranch } from 'lucide-react'
import { CURRICULUM } from '@/lib/curriculum'
import { CurriculumMindmap } from './CurriculumMindmap'

const TIER_META: Record<string, { color: string; ages: string }> = {
  'Coding Explorers':    { color: '#1E8449', ages: '4–6 yrs' },
  'Junior Coders':       { color: '#1E8449', ages: '6–8 yrs' },
  'Robotics Junior':     { color: '#1A5276', ages: '8–10 yrs' },
  'Robotics Advanced':   { color: '#1A5276', ages: '10–12 yrs' },
  'Creative Junior':     { color: '#6C3483', ages: '8–10 yrs' },
  'Creative Advanced':   { color: '#6C3483', ages: '10–12 yrs' },
  'Specialist Junior':   { color: '#117A65', ages: '8–10 yrs' },
  'Specialist Advanced': { color: '#117A65', ages: '10–12 yrs' },
}

const CATEGORY_GROUPS = [
  { label: 'Foundation', color: '#1E8449', tiers: ['Coding Explorers', 'Junior Coders'] },
  { label: 'Robotics',   color: '#1A5276', tiers: ['Robotics Junior', 'Robotics Advanced'] },
  { label: 'Creative',   color: '#6C3483', tiers: ['Creative Junior', 'Creative Advanced'] },
  { label: 'Specialist', color: '#117A65', tiers: ['Specialist Junior', 'Specialist Advanced'] },
]

function GridView() {
  return (
    <div className="space-y-6">
      {CATEGORY_GROUPS.map(({ label, color, tiers }) => (
        <div key={label}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
            <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {tiers.map(tier => {
              const meta = TIER_META[tier]
              const modules = CURRICULUM[tier] ?? []
              return (
                <div key={tier} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4" style={{ background: meta.color }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white">{tier}</h3>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>{modules.length} modules</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.9)' }}>
                        {meta.ages}
                      </span>
                    </div>
                  </div>
                  <div className="p-5">
                    <ol className="space-y-2">
                      {modules.map((mod, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
                            style={{ backgroundColor: meta.color }}>
                            {idx + 1}
                          </span>
                          <span className="text-sm text-gray-700 leading-snug">{mod}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export function CurriculumView() {
  const [view, setView] = useState<'grid' | 'mindmap'>('grid')

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Curriculum Reference</h1>
          <p className="text-sm text-gray-400 mt-0.5">All tiers and module sequences — read-only</p>
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              view === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grid
          </button>
          <button
            onClick={() => setView('mindmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              view === 'mindmap' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" /> Mindmap
          </button>
        </div>
      </div>

      {view === 'grid' ? <GridView /> : <CurriculumMindmap />}
    </div>
  )
}
