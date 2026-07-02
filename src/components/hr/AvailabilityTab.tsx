'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SUBJECT_META, SUBJECTS, type Subject } from '@/types'
import type { Teacher } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekStart(d = new Date()) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  const y  = monday.getFullYear()
  const m  = String(monday.getMonth() + 1).padStart(2, '0')
  const dd = String(monday.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

type AvailRow = {
  teacher_id: string
  day_of_week: number
  is_available: boolean
  note: string | null
}

export function AvailabilityTab({ teachers }: { teachers: Teacher[] }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [rows, setRows] = useState<AvailRow[]>([])
  const [loading, setLoading] = useState(true)
  const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all')
  const [dayFilter, setDayFilter] = useState<number | null>(null)
  const supabase = createClient()
  const weekStart = getWeekStart()

  useEffect(() => {
    supabase
      .from('teacher_availability')
      .select('teacher_id, day_of_week, is_available, note')
      .eq('week_start', weekStart)
      .then(({ data }) => {
        setRows(data ?? [])
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const activeTeachers = teachers.filter(teacher => teacher.active !== false)

  const filteredTeachers = activeTeachers.filter(teacher =>
    subjectFilter === 'all' || (teacher.subjects ?? []).includes(subjectFilter)
  )

  function isAvail(teacherId: string, day: number) {
    return rows.find(r => r.teacher_id === teacherId && r.day_of_week === day)
  }

  async function toggleCell(teacherId: string, day: number) {
    const existing = isAvail(teacherId, day)
    if (!existing) {
      await supabase.from('teacher_availability').upsert(
        { teacher_id: teacherId, day_of_week: day, is_available: true, week_start: weekStart, note: null },
        { onConflict: 'teacher_id,day_of_week,week_start' }
      )
      setRows(prev => [...prev, { teacher_id: teacherId, day_of_week: day, is_available: true, note: null }])
    } else if (existing.is_available) {
      await supabase.from('teacher_availability').upsert(
        { teacher_id: teacherId, day_of_week: day, is_available: false, week_start: weekStart, note: null },
        { onConflict: 'teacher_id,day_of_week,week_start' }
      )
      setRows(prev => prev.map(r => r.teacher_id === teacherId && r.day_of_week === day ? { ...r, is_available: false } : r))
    } else {
      await supabase.from('teacher_availability').delete()
        .eq('teacher_id', teacherId).eq('day_of_week', day).eq('week_start', weekStart)
      setRows(prev => prev.filter(r => !(r.teacher_id === teacherId && r.day_of_week === day)))
    }
  }

  // cover finder: who is available on a given day + teaches a given subject
  const coverCandidates = dayFilter !== null
    ? filteredTeachers.filter(teacher => {
        const row = rows.find(r => r.teacher_id === teacher.id && r.day_of_week === dayFilter)
        return row?.is_available === true
      })
    : []

  if (loading) return <div className="py-20 text-center text-sm text-gray-400">{t.hr_availability.loading}</div>

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500">{t.hr_availability.subject_filter}</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSubjectFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                subjectFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.hr_availability.all}
            </button>
            {SUBJECTS.map(s => {
              const meta = SUBJECT_META[s]
              const active = subjectFilter === s
              return (
                <button key={s} onClick={() => setSubjectFilter(s)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border"
                  style={active
                    ? { background: meta.color, color: '#fff', borderColor: meta.color }
                    : { background: meta.bg, color: meta.color, borderColor: meta.color + '50' }
                  }
                >
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Availability grid */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">
            {(() => {
              const start = new Date(weekStart + 'T00:00:00')
              const end   = new Date(weekStart + 'T00:00:00')
              end.setDate(start.getDate() + 6)
              const fmt = (d: Date) => d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
              return `${fmt(start)} – ${fmt(end)} ${start.getFullYear()}`
            })()}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Resets every Monday · {t.hr_availability.legend} · Click a cell to edit on behalf of a teacher.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 w-48">{t.hr_availability.teacher_col}</th>
                {DAYS.map((d, i) => (
                  <th key={d}
                    className={`text-center text-xs font-semibold px-3 py-3 cursor-pointer select-none transition-colors ${
                      dayFilter === i ? 'text-[#1A5276] bg-[#EBF5FB]' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setDayFilter(dayFilter === i ? null : i)}
                    title="Click to find cover for this day"
                  >
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">
                    {t.hr_availability.no_teachers}
                  </td>
                </tr>
              ) : (
                filteredTeachers.map(teacher => (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-900 text-xs">{teacher.name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {(teacher.subjects ?? []).map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                            style={{ color: SUBJECT_META[s].color, background: SUBJECT_META[s].bg }}>
                            {SUBJECT_META[s].label}
                          </span>
                        ))}
                      </div>
                    </td>
                    {DAYS.map((_, i) => {
                      const row = isAvail(teacher.id, i)
                      return (
                        <td key={i} className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleCell(teacher.id, i)}
                            title={!row ? 'Click to mark available' : row.is_available ? 'Available — click to mark unavailable' : 'Unavailable — click to clear'}
                            className="transition-transform hover:scale-110 active:scale-95"
                          >
                            {!row ? (
                              <span className="inline-block w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" />
                            ) : row.is_available ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 font-bold text-xs">✓</span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-50 text-red-400 font-bold text-xs">✕</span>
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cover finder */}
      {dayFilter !== null && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">
              {t.hr_availability.cover_finder} — {DAYS[dayFilter]}
              {subjectFilter !== 'all' && ` · ${SUBJECT_META[subjectFilter].label}`}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{t.hr_availability.available_on_day}</p>
          </div>
          <div className="p-5">
            {coverCandidates.length === 0 ? (
              <p className="text-sm text-gray-400">{t.hr_availability.no_candidates}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {coverCandidates.map(teacher => {
                  const note = rows.find(r => r.teacher_id === teacher.id && r.day_of_week === dayFilter)?.note
                  return (
                    <div key={teacher.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-green-200 bg-green-50">
                      <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{teacher.name}</p>
                        {note && <p className="text-[10px] text-gray-500 mt-0.5">{note}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
