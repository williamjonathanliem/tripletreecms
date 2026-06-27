'use client'

import { useState } from 'react'
import { LayoutGrid, GitBranch, ChevronDown, Trophy } from 'lucide-react'
import { CURRICULUM_DATA, TRIAL_CLASS, TAG_STYLES, type TierData } from '@/lib/curriculumData'
import { CurriculumMindmap } from './CurriculumMindmap'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

const CATEGORY_CONFIG: { key: keyof typeof CMS_T['en']['curriculum']; color: string; tiers: string[] }[] = [
  { key: 'track_foundation', color: '#117A65', tiers: ['Coding Explorers', 'Junior Coders'] },
  { key: 'track_robotics',   color: '#1A5276', tiers: ['Robotics Junior', 'Robotics Advanced'] },
  { key: 'track_creative',   color: '#6C3483', tiers: ['Creative Junior', 'Creative Advanced'] },
  { key: 'track_specialist', color: '#1E8449', tiers: ['Specialist Junior', 'Specialist Advanced'] },
]

function TierCard({ tier }: { tier: TierData }) {
  const [open, setOpen] = useState(false)

  function tagColor(tag: string) {
    return TAG_STYLES[tag] ?? { text: '#6B7280', bg: '#F3F4F6' }
  }

  function isLight(color: string) {
    const hex = color.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return r * 0.299 + g * 0.587 + b * 0.114 > 160
  }

  const showcaseBg = tier.color + '12'
  const headerTextColor = isLight(tier.color) ? '#1F2937' : '#FFFFFF'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:opacity-90"
        style={{ background: tier.color }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-base font-bold" style={{ color: headerTextColor }}>{tier.name}</h3>
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap"
              style={{ background: 'rgba(255,255,255,0.2)', color: headerTextColor }}
            >
              {tier.ages}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap" style={{ color: headerTextColor }}>
            <span className="text-xs opacity-75">
              {tier.sessions} sessions{tier.sessionsNote ? <span className="opacity-70"> {tier.sessionsNote}</span> : null} · {tier.duration}
            </span>
            <span className="text-xs opacity-60">{tier.hardware}</span>
          </div>
        </div>
        <ChevronDown
          className="w-5 h-5 shrink-0 transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: headerTextColor }}
        />
      </button>

      <div
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{ maxHeight: open ? '3000px' : '0px' }}
      >
        <div className="p-5">
          <ol className="space-y-1.5">
            {tier.modules.map((mod, idx) => (
              <li
                key={idx}
                className={`flex items-start gap-3 p-2 rounded-xl ${mod.isShowcase ? 'font-semibold' : ''}`}
                style={mod.isShowcase ? { background: showcaseBg } : undefined}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
                  style={{ background: mod.isShowcase ? tier.color : tier.color + 'cc' }}
                >
                  {mod.isShowcase ? <Trophy className="w-3 h-3" /> : idx + 1}
                </span>
                <div className="flex-1 min-w-0 pt-0.5">
                  <span className={`text-sm leading-snug text-gray-700 ${mod.isShowcase ? 'font-bold' : ''}`}>
                    {mod.name}
                  </span>
                  {mod.tags.length > 0 && (
                    <span className="inline-flex gap-1 ml-1.5">
                      {mod.tags.map(t => {
                        const tc = tagColor(t)
                        return (
                          <span
                            key={t}
                            className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-sm leading-none"
                            style={{ color: tc.text, background: tc.bg }}
                          >
                            {t}
                          </span>
                        )
                      })}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

function TrackFlow() {
  const { lang } = useCmsLang()
  const t = CMS_T[lang].curriculum

  return (
    <div className="flex items-center justify-center gap-3 py-3 px-4 bg-gray-50 rounded-2xl text-xs text-gray-500">
      <span className="font-semibold text-gray-700">{t.track_foundation}</span>
      <span className="text-gray-300">{t.track_all_students}</span>
      <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-300" />
      <span className="font-semibold text-gray-700">{t.track_age}</span>
      <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-300" />
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#1A5276' }} />
        <span className="font-medium">{t.track_robotics}</span>
      </span>
      <span className="text-gray-300">·</span>
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#6C3483' }} />
        <span className="font-medium">{t.track_creative}</span>
      </span>
      <span className="text-gray-300">·</span>
      <span className="flex items-center gap-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#1E8449' }} />
        <span className="font-medium">{t.track_specialist}</span>
      </span>
      <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-300" />
      <span className="font-semibold text-gray-700">{t.track_advanced}</span>
    </div>
  )
}

function TrialClassCard() {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#C9A84C' }}>
      <div className="px-6 py-4" style={{ background: '#FFF8E1' }}>
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#8D6E00' }}>
            {TRIAL_CLASS.title}
          </h3>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#C9A84C33', color: '#8D6E00' }}>
            {TRIAL_CLASS.ages}
          </span>
        </div>
        <p className="text-xs" style={{ color: '#8D6E00' }}>
          {TRIAL_CLASS.duration} · {TRIAL_CLASS.hardware}
        </p>
      </div>
      <div className="px-6 py-4 bg-white space-y-3">
        {TRIAL_CLASS.timeBlocks.map((block, i) => (
          <div key={i} className="flex items-start gap-3">
            <span
              className="text-[11px] font-bold px-2 py-1 rounded-md whitespace-nowrap shrink-0 mt-0.5"
              style={{ background: '#C9A84C33', color: '#8D6E00' }}
            >
              {block.time}
            </span>
            <span className="text-sm text-gray-700 leading-snug">{block.label}</span>
          </div>
        ))}
        <p className="text-xs italic text-gray-400 mt-2">{TRIAL_CLASS.note}</p>
      </div>
    </div>
  )
}

function GridView() {
  const { lang } = useCmsLang()
  const t = CMS_T[lang].curriculum

  return (
    <div className="space-y-8">
      <TrackFlow />

      {CATEGORY_CONFIG.map(({ key, color, tiers: tierNames }) => {
        const tierData = CURRICULUM_DATA.filter(t => tierNames.includes(t.name))
        const label = t[key] as string
        return (
          <div key={key}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-5 rounded-full" style={{ backgroundColor: color }} />
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color }}>{label}</h2>
            </div>
            <div className="flex flex-col gap-3">
              {tierData.map(tier => (
                <TierCard key={tier.id} tier={tier} />
              ))}
            </div>
          </div>
        )
      })}

      <TrialClassCard />
    </div>
  )
}

export function CurriculumView() {
  const { lang } = useCmsLang()
  const t = CMS_T[lang].curriculum

  const [view, setView] = useState<'grid' | 'mindmap'>('grid')

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              view === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> {t.grid_view}
          </button>
          <button
            onClick={() => setView('mindmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              view === 'mindmap' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" /> {t.mindmap_view}
          </button>
        </div>
      </div>

      {view === 'grid' ? <GridView /> : <CurriculumMindmap />}
    </div>
  )
}
