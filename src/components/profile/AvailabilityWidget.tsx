'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

const HOURS = Array.from({ length: 14 }, (_, i) => {
  const h = i + 8 // 8am – 9pm
  const label = h < 12 ? `${h}:00 am` : h === 12 ? '12:00 pm' : `${h - 12}:00 pm`
  const value = `${String(h).padStart(2, '0')}:00`
  return { label, value }
})

function getMondayOfWeek(d = new Date()) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  const y  = monday.getFullYear()
  const m  = String(monday.getMonth() + 1).padStart(2, '0')
  const dd = String(monday.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

type DayState = {
  is_available: boolean
  start_time: string
  end_time: string
  note: string
}

const DEFAULT_DAY: DayState = { is_available: false, start_time: '09:00', end_time: '18:00', note: '' }

function TimeSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-2.5 py-1.5 rounded-lg border border-[#1A5276]/30 bg-white text-[#1A5276] text-xs font-medium focus:outline-none cursor-pointer"
    >
      {HOURS.map(h => (
        <option key={h.value} value={h.value}>{h.label}</option>
      ))}
    </select>
  )
}

export function AvailabilityWidget({ teacherId }: { teacherId: string }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  // Use translated day names; cast to mutable array for indexing
  const DAYS = t.profile.days as readonly string[]

  const weekStart = getMondayOfWeek()
  const supabase = createClient()

  const [days, setDays] = useState<DayState[]>(DAYS.map(() => ({ ...DEFAULT_DAY })))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('teacher_availability')
      .select('day_of_week, is_available, start_time, end_time, note')
      .eq('teacher_id', teacherId)
      .eq('week_start', weekStart)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const next = DAYS.map((_, i) => {
            const row = data.find(r => r.day_of_week === i)
            return row
              ? { is_available: row.is_available, start_time: row.start_time.slice(0, 5), end_time: row.end_time.slice(0, 5), note: row.note ?? '' }
              : { ...DEFAULT_DAY }
          })
          setDays(next)
        }
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(i: number) {
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, is_available: !d.is_available } : d))
  }

  function update(i: number, field: keyof DayState, value: string | boolean) {
    setDays(prev => prev.map((d, idx) => idx === i ? { ...d, [field]: value } : d))
  }

  async function save() {
    setSaving(true)
    const rows = days.map((d, i) => ({
      teacher_id: teacherId,
      week_start: weekStart,
      day_of_week: i,
      is_available: d.is_available,
      start_time: d.start_time,
      end_time: d.end_time,
      note: d.note.trim() || null,
    }))

    const { error } = await supabase
      .from('teacher_availability')
      .upsert(rows, { onConflict: 'teacher_id,week_start,day_of_week,start_time', ignoreDuplicates: false })

    setSaving(false)
    if (error) { toast.error('Failed to save availability'); return }
    toast.success('Availability saved for this week')
  }

  const weekLabel = new Date(weekStart + 'T00:00:00').toLocaleDateString('en-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> {t.common.loading}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{t.profile.week_of} {weekLabel}</p>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
          style={{ background: '#1A5276' }}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {t.profile.save}
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
        {DAYS.map((day, i) => {
          const d = days[i]
          return (
            <div key={day} className={`transition-colors ${d.is_available ? 'bg-[#F0F7FF]' : 'bg-white'}`}>
              <div className="flex items-center gap-3 px-4 py-2.5">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-label={`Toggle ${day}`}
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 focus:outline-none ${
                    d.is_available ? 'bg-[#1A5276]' : 'bg-gray-200'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    d.is_available ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>

                <span className={`text-sm font-medium w-[90px] shrink-0 ${d.is_available ? 'text-[#1A5276]' : 'text-gray-400'}`}>
                  {day}
                </span>

                {d.is_available ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <TimeSelect value={d.start_time} onChange={v => update(i, 'start_time', v)} />
                    <span className="text-xs text-gray-400">–</span>
                    <TimeSelect value={d.end_time} onChange={v => update(i, 'end_time', v)} />
                    <input
                      type="text"
                      value={d.note}
                      onChange={e => update(i, 'note', e.target.value)}
                      placeholder={t.profile.note_placeholder}
                      className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-600 placeholder:text-gray-300 focus:outline-none focus:border-[#1A5276]/40 transition-colors"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-gray-300">{t.profile.not_available}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
