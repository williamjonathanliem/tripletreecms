'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, Users } from 'lucide-react'
import { TIER_COLORS } from '@/types'

type StatusValue = 'present' | 'late' | 'absent' | 'excused'

interface RosterStudent { id: string; name: string; tier: string; branch: string }
interface ExistingRecord { student_id: string; status: StatusValue }

interface Props {
  sessionId: string
  classId: string
  roster: RosterStudent[]
  existing: ExistingRecord[]
}

const STATUS_CONFIG: Record<StatusValue, { label: string; bg: string; color: string; activeBg: string }> = {
  present: { label: 'Present', bg: '#F0FFF4', color: '#1E8449', activeBg: '#1E8449' },
  late:    { label: 'Late',    bg: '#FFFBEB', color: '#B45309', activeBg: '#D97706' },
  absent:  { label: 'Absent',  bg: '#FEF2F2', color: '#DC2626', activeBg: '#DC2626' },
  excused: { label: 'Excused', bg: '#F5F5F5', color: '#6B7280', activeBg: '#6B7280' },
}

const ALL_STATUSES: StatusValue[] = ['present', 'late', 'absent', 'excused']

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function AttendanceSheet({ sessionId, classId, roster, existing }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [statuses, setStatuses] = useState<Record<string, StatusValue>>(() => {
    const init: Record<string, StatusValue> = {}
    roster.forEach(s => {
      const found = existing.find(e => e.student_id === s.id)
      init[s.id] = found?.status ?? 'absent'
    })
    return init
  })
  const [saving, setSaving] = useState(false)

  function setStatus(studentId: string, status: StatusValue) {
    setStatuses(prev => ({ ...prev, [studentId]: status }))
  }

  function markAll(status: StatusValue) {
    const next: Record<string, StatusValue> = {}
    roster.forEach(s => { next[s.id] = status })
    setStatuses(next)
  }

  async function handleSave() {
    setSaving(true)
    const records = roster.map(s => ({
      session_id: sessionId,
      class_id: classId,
      student_id: s.id,
      status: statuses[s.id] ?? 'absent',
    }))
    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'session_id,student_id' })
    if (error) { toast.error('Failed to save attendance'); setSaving(false); return }
    toast.success('Attendance saved')
    setSaving(false)
    router.refresh()
  }

  if (roster.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
        <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No students in roster.</p>
        <p className="text-xs text-gray-400 mt-1">Add students to this class from the class page.</p>
      </div>
    )
  }

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = Object.values(statuses).filter(v => v === s).length
    return acc
  }, {} as Record<StatusValue, number>)

  return (
    <div className="space-y-4">
      {/* Summary + bulk actions */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex-wrap">
        {ALL_STATUSES.map(s => {
          const cfg = STATUS_CONFIG[s]
          return (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.activeBg }} />
              <span className="text-xs text-gray-600">{counts[s]} {cfg.label}</span>
            </div>
          )
        })}
        <div className="ml-auto flex gap-2">
          <button onClick={() => markAll('present')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            style={{ background: '#EAFAF1', color: '#1E8449' }}>
            All Present
          </button>
          <button onClick={() => markAll('absent')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            All Absent
          </button>
        </div>
      </div>

      {/* Student rows */}
      <div className="space-y-2">
        {roster.map(student => {
          const current = statuses[student.id] ?? 'absent'
          const color = TIER_COLORS[student.tier] || '#6B7280'
          return (
            <div key={student.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: color }}>
                  {initials(student.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{student.name}</p>
                  <p className="text-xs text-gray-400">{student.branch}</p>
                </div>
                <div className="flex gap-1.5 flex-wrap shrink-0">
                  {ALL_STATUSES.map(s => {
                    const cfg = STATUS_CONFIG[s]
                    const active = current === s
                    return (
                      <button key={s} onClick={() => setStatus(student.id, s)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                        style={active
                          ? { background: cfg.activeBg, color: '#fff' }
                          : { background: cfg.bg, color: cfg.color }
                        }>
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white disabled:opacity-60"
        style={{ background: '#1E8449' }}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Attendance
      </button>
    </div>
  )
}
