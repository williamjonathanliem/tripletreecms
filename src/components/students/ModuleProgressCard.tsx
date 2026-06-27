'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { TIER_COLORS, SUBJECT_META, type Subject } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

interface Props {
  studentId: string
  studentName: string
  tier: string
  subject: Subject
  moduleCurrent: number
  moduleTotal: number
  modules: string[]
}

export function ModuleProgressCard({
  studentId, studentName, tier, subject, moduleCurrent, moduleTotal, modules,
}: Props) {
  const [current, setCurrent] = useState(moduleCurrent)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const color = TIER_COLORS[tier] || SUBJECT_META[subject]?.color || '#6B7280'
  const { lang } = useCmsLang()
  const mp = CMS_T[lang].module_progress

  async function moveTo(next: number) {
    if (next < 0 || next > moduleTotal) return
    setSaving(true)
    const { error } = await supabase
      .from('students')
      .update({ module_current: next })
      .eq('id', studentId)
    setSaving(false)
    if (error) { toast.error(mp.failed_update); return }
    setCurrent(next)
    toast.success(next >= moduleTotal
      ? `${studentName} ${mp.complete_toast}`
      : `${mp.module_counter} ${next + 1} — ${modules[next] ?? 'next module'}`
    )
    router.refresh()
  }

  const pct = moduleTotal > 0 ? Math.round((current / moduleTotal) * 100) : 0
  const isComplete = current >= moduleTotal

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">{mp.title}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{tier}</p>
        </div>
        {isComplete && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> {mp.completed_badge}
          </span>
        )}
      </div>

      {/* Progress bar + controls */}
      <div className="px-6 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => moveTo(current - 1)}
            disabled={current === 0 || saving}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span className="font-semibold">{mp.module_counter} {current}/{moduleTotal}</span>
              <span className="tabular-nums">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
          <button
            onClick={() => moveTo(current + 1)}
            disabled={current >= moduleTotal || saving}
            className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-center text-gray-400">
          {isComplete
            ? mp.all_done
            : current < modules.length
              ? <>{mp.currently_on} <span className="font-semibold text-gray-700">{modules[current]}</span></>
              : mp.all_done}
        </p>
      </div>

      {/* Module list */}
      <div className="px-6 pb-4 space-y-2">
        {modules.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{mp.no_curriculum}</p>
        ) : modules.map((module, idx) => {
          const isDone = idx < current
          const isCurrent = idx === current
          return (
            <button key={idx} onClick={() => moveTo(idx + 1)}
              title={isDone ? 'Click to mark as incomplete' : isCurrent ? 'Click to mark as complete' : ''}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                isCurrent ? 'bg-blue-50 border border-blue-100 hover:bg-blue-100' :
                isDone ? 'bg-gray-50 hover:bg-gray-100' : 'opacity-40 cursor-default'
              }`}
              disabled={!isDone && !isCurrent}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                isDone ? 'bg-green-500 text-white' :
                isCurrent ? 'border-2 border-blue-500 text-blue-600' :
                'border border-gray-200 text-gray-300'
              }`}>
                {isDone ? '✓' : idx + 1}
              </div>
              <span className={`text-sm flex-1 ${
                isCurrent ? 'font-semibold text-blue-800' :
                isDone ? 'text-gray-700' : 'text-gray-300'
              }`}>{module}</span>
              {isCurrent && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
                  {mp.current_label}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
