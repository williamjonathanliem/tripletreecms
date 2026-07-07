'use client'

import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react'

type StatusValue = 'present' | 'late' | 'absent' | 'excused'
type DayRecord = { id: string; date: string; status: string }

const CYCLE: StatusValue[] = ['present', 'late', 'absent', 'excused']

const S: Record<StatusValue, { fill: string; border: string; label: string }> = {
  present: { fill: '#22c55e', border: '#16a34a', label: 'Present' },
  late:    { fill: '#f59e0b', border: '#d97706', label: 'Late'    },
  absent:  { fill: '#f87171', border: '#ef4444', label: 'Absent'  },
  excused: { fill: '#d1d5db', border: '#9ca3af', label: 'Excused' },
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate() }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
function shortDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })
}

type AttendanceRecord = {
  id: string; status: string; note?: string | null
  class: { tier?: string; branch?: string } | null
  session: { session_date?: string; session_time?: string } | null
}

interface Props {
  studentId: string
  moduleTotal: number
  attendanceRecords: AttendanceRecord[]
  dailyAttendance: DayRecord[]
  isHR: boolean
  color: string
}

export function AttendanceCard({
  studentId, moduleTotal, attendanceRecords, dailyAttendance, isHR, color,
}: Props) {
  const now = new Date()
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())
  const [dayRecords, setDayRecords] = useState<DayRecord[]>(dailyAttendance)
  const [total,       setTotal]     = useState(moduleTotal)
  const [editingTotal, setEditingTotal] = useState(false)
  const [totalDraft,   setTotalDraft]   = useState(String(moduleTotal))
  const [savingTotal,  setSavingTotal]  = useState(false)
  const [busy, setBusy] = useState<string | null>(null)   // date string currently saving
  const router   = useRouter()
  const supabase = createClient()

  // date string → record for the current view month
  const dayMap = useMemo(() => {
    const m: Record<number, DayRecord> = {}
    dayRecords.forEach(r => {
      const dt = new Date(r.date + 'T00:00:00')
      if (dt.getFullYear() === viewYear && dt.getMonth() === viewMonth)
        m[dt.getDate()] = r
    })
    return m
  }, [dayRecords, viewYear, viewMonth])

  const days = daysInMonth(viewYear, viewMonth)
  const attended = dayRecords.filter(r => r.status === 'present' || r.status === 'late').length
  const pct      = total > 0 ? Math.round((attended / total) * 100) : 0

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  async function tapDay(day: number) {
    const dateStr   = toDateStr(viewYear, viewMonth, day)
    const existing  = dayMap[day]
    setBusy(dateStr)

    if (existing) {
      // Cycle to next status
      const idx  = CYCLE.indexOf(existing.status as StatusValue)
      const next = CYCLE[(idx + 1) % CYCLE.length]

      if (next === 'present' && idx === CYCLE.length - 1) {
        // Wrapped back to start — delete the record (clear the day)
        const { error } = await supabase.from('student_attendance').delete().eq('id', existing.id)
        if (error) { toast.error('Failed to update'); setBusy(null); return }
        setDayRecords(prev => prev.filter(r => r.id !== existing.id))
      } else {
        const { error } = await supabase.from('student_attendance')
          .update({ status: next }).eq('id', existing.id)
        if (error) { toast.error('Failed to update'); setBusy(null); return }
        setDayRecords(prev => prev.map(r => r.id === existing.id ? { ...r, status: next } : r))
      }
    } else {
      // Create new — first click = present
      const { data, error } = await supabase.from('student_attendance')
        .insert({ student_id: studentId, date: dateStr, status: 'present' })
        .select().single()
      if (error) { toast.error('Failed to mark attendance'); setBusy(null); return }
      setDayRecords(prev => [...prev, data as DayRecord])
    }

    // Sync module_current to count of present+late
    const updated = dayRecords.filter(r => {
      if (existing && r.id === existing.id) return false
      return r.status === 'present' || r.status === 'late'
    })
    const newCount = existing
      ? (CYCLE[(CYCLE.indexOf(existing.status as StatusValue) + 1) % CYCLE.length] === 'present'
          ? updated.length  // about to delete
          : [...updated, { status: CYCLE[(CYCLE.indexOf(existing.status as StatusValue) + 1) % CYCLE.length] }]
              .filter(r => r.status === 'present' || r.status === 'late').length)
      : attended + 1
    await supabase.from('students').update({ module_current: newCount }).eq('id', studentId)

    setBusy(null)
    router.refresh()
  }

  async function saveTotal() {
    const n = Math.max(1, parseInt(totalDraft) || 1)
    setSavingTotal(true)
    const { error } = await supabase.from('students').update({ module_total: n }).eq('id', studentId)
    setSavingTotal(false)
    if (error) { toast.error('Failed to update'); return }
    setTotal(n)
    setEditingTotal(false)
    toast.success('Total updated')
    router.refresh()
  }

  const DOT = 22

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-bold text-gray-900">Attendance</h2>
          <div className="flex items-center gap-0.5">
            <button onClick={prevMonth}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold text-gray-600 w-28 text-center">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          {(['present','late','absent'] as StatusValue[]).map(s => (
            <span key={s} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: S[s].fill }} />
              <span className="text-gray-500">
                {dayRecords.filter(r => r.status === s).length} {S[s].label.toLowerCase()}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: days * (DOT + 6) + 48, padding: '16px 24px' }}>

          {/* Day numbers */}
          <div className="flex gap-1.5 mb-2">
            {Array.from({ length: days }, (_, i) => i + 1).map(d => (
              <div key={d} style={{ width: DOT, flexShrink: 0 }}
                className="text-center text-[10px] font-semibold text-gray-300 select-none">
                {d}
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: days }, (_, i) => i + 1).map(day => {
              const record  = dayMap[day]
              const dateStr = toDateStr(viewYear, viewMonth, day)
              const loading = busy === dateStr
              const status  = (record?.status ?? null) as StatusValue | null
              const meta    = status ? S[status] : null

              return (
                <button key={day}
                  onClick={() => tapDay(day)}
                  disabled={loading}
                  title={status ? `${S[status].label} — click to change` : 'Click to mark present'}
                  style={{
                    width: DOT, height: DOT, flexShrink: 0,
                    borderRadius: '50%',
                    border: meta ? `2px solid ${meta.border}` : '1.5px solid #e5e7eb',
                    background: meta ? meta.fill : '#f9fafb',
                    opacity: loading ? 0.4 : 1,
                    cursor: 'pointer',
                    transition: 'transform 0.1s, opacity 0.15s',
                  }}
                  className="hover:scale-110 active:scale-95 disabled:hover:scale-100"
                />
              )
            })}
          </div>

          {/* Weekday row */}
          <div className="flex gap-1.5 mt-1.5">
            {Array.from({ length: days }, (_, i) => i + 1).map(d => (
              <div key={d} style={{ width: DOT, flexShrink: 0 }}
                className="text-center text-[9px] text-gray-200 select-none">
                {new Date(viewYear, viewMonth, d).toLocaleDateString('en-MY', { weekday: 'narrow' })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-1 max-w-48">
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
          <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
            <span className="font-semibold text-gray-800">{attended}</span> / {total} classes
            <span className="ml-1.5" style={{ color }}>{pct}%</span>
          </span>
        </div>

        {isHR && !editingTotal && (
          <button onClick={() => { setEditingTotal(true); setTotalDraft(String(total)) }}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            <Pencil className="w-3 h-3" /> Edit total
          </button>
        )}
        {isHR && editingTotal && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs text-gray-400">Total:</span>
            <input autoFocus type="number" min={1} value={totalDraft}
              onChange={e => setTotalDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveTotal(); if (e.key === 'Escape') setEditingTotal(false) }}
              className="w-14 px-1.5 py-0.5 text-xs text-center border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
            />
            <button onClick={saveTotal} disabled={savingTotal}
              className="w-5 h-5 flex items-center justify-center rounded bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50">
              <Check className="w-3 h-3" />
            </button>
            <button onClick={() => setEditingTotal(false)}
              className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 text-gray-400 hover:bg-gray-200">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Session records from AttendanceSheet (read-only reference) */}
      {attendanceRecords.length > 0 && (
        <div className="px-6 pb-4 border-t border-gray-50">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mt-3 mb-2">
            Class session records
          </p>
          <div>
            {attendanceRecords.map(r => {
              const status = (r.status ?? 'absent') as StatusValue
              const meta   = S[status] ?? S.absent
              return (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: meta.fill }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {r.class?.tier ?? '—'}
                      {r.class?.branch && <span className="text-gray-400 font-normal"> · {r.class.branch}</span>}
                    </p>
                    {r.session?.session_date && (
                      <p className="text-xs text-gray-400">{shortDate(r.session.session_date)}{r.session.session_time && ` · ${r.session.session_time.slice(0, 5)}`}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: meta.fill + '22', color: meta.border }}>
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
