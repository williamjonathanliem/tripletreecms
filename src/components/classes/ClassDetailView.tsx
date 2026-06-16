'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Clock, ClipboardList, MessageSquarePlus, Users, BookOpen } from 'lucide-react'
import { LogSessionDialog } from './LogSessionDialog'
import { EditClassDialog } from './EditClassDialog'
import { TIER_COLORS, type ClassGroup } from '@/types'

interface RosterStudent { id: string; name: string; tier: string; branch: string }
interface SessionRow {
  id: string; class_id: string; session_date: string; session_time: string; notes: string | null
}
interface AttendanceCount { session_id: string; status: string }

interface Props {
  cls: ClassGroup
  roster: RosterStudent[]
  sessions: SessionRow[]
  attendanceCounts: AttendanceCount[]
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export function ClassDetailView({ cls, roster, sessions, attendanceCounts }: Props) {
  const [tab, setTab] = useState<'roster' | 'sessions'>('roster')
  const color = TIER_COLORS[cls.tier] || '#6B7280'

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <LogSessionDialog classId={cls.id} defaultTime={cls.schedule_time ?? undefined} />
        <EditClassDialog cls={cls} compact />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(['roster', 'sessions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t === 'roster' ? `Roster (${roster.length})` : `Sessions (${sessions.length})`}
          </button>
        ))}
      </div>

      {tab === 'roster' ? (
        <RosterTab roster={roster} color={color} />
      ) : (
        <SessionsTab sessions={sessions} attendanceCounts={attendanceCounts} classId={cls.id} />
      )}
    </div>
  )
}

function RosterTab({ roster, color }: { roster: RosterStudent[]; color: string }) {
  if (roster.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
        <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No students enrolled yet.</p>
        <p className="text-xs text-gray-400 mt-1">Use Edit → Roster to add students.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {roster.map(s => (
        <div key={s.id} className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: color }}>
            {initials(s.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900">{s.name}</p>
            <p className="text-xs text-gray-400">{s.branch}</p>
          </div>
          <Link href={`/students/${s.id}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
            Profile
          </Link>
        </div>
      ))}
    </div>
  )
}

function SessionsTab({
  sessions, attendanceCounts, classId,
}: { sessions: SessionRow[]; attendanceCounts: AttendanceCount[]; classId: string }) {
  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
        <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No sessions logged yet.</p>
        <p className="text-xs text-gray-400 mt-1">Click &quot;Log Session&quot; to start tracking attendance.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map(session => {
        const counts = {
          present: attendanceCounts.filter(a => a.session_id === session.id && a.status === 'present').length,
          late:    attendanceCounts.filter(a => a.session_id === session.id && a.status === 'late').length,
          absent:  attendanceCounts.filter(a => a.session_id === session.id && a.status === 'absent').length,
          excused: attendanceCounts.filter(a => a.session_id === session.id && a.status === 'excused').length,
        }
        const total = Object.values(counts).reduce((a, b) => a + b, 0)

        return (
          <div key={session.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-gray-400" />
                    {formatDate(session.session_date)}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatTime(session.session_time)}
                  </span>
                </div>
                {total > 0 && (
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {counts.present > 0 && <span className="text-xs text-green-700 font-semibold">● {counts.present} Present</span>}
                    {counts.late > 0    && <span className="text-xs text-amber-600 font-semibold">● {counts.late} Late</span>}
                    {counts.absent > 0  && <span className="text-xs text-red-600 font-semibold">● {counts.absent} Absent</span>}
                    {counts.excused > 0 && <span className="text-xs text-gray-500 font-semibold">● {counts.excused} Excused</span>}
                  </div>
                )}
                {session.notes && (
                  <p className="text-xs text-gray-400 italic mt-1.5">{session.notes}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Link href={`/classes/${classId}/sessions/${session.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                  style={{ background: '#EAFAF1', color: '#1E8449' }}>
                  <ClipboardList className="w-3.5 h-3.5" /> Attendance
                </Link>
                <Link href={`/feedback?session=${session.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  <MessageSquarePlus className="w-3.5 h-3.5" /> Log
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
