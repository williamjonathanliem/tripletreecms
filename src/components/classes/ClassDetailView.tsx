'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock, ClipboardList, MessageSquarePlus, Users, BookOpen, UserPlus, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { LogSessionDialog } from './LogSessionDialog'
import { EditClassDialog } from './EditClassDialog'
import { TIER_COLORS, type ClassGroup } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

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

function EnrollPanel({ cls, roster, color, onEnrolled }: {
  cls: ClassGroup
  roster: RosterStudent[]
  color: string
  onEnrolled: () => void
}) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [open, setOpen] = useState(false)
  const [available, setAvailable] = useState<{ id: string; name: string; branch: string }[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const supabase = createClient()

  async function openPanel() {
    setOpen(true)
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const enrolledIds = new Set(roster.map(s => s.id))
    const { data } = await supabase
      .from('students')
      .select('id, name, branch')
      .eq('teacher_id', user.id)
      .eq('tier', cls.tier)
      .order('name')
    setAvailable((data ?? []).filter(s => !enrolledIds.has(s.id)))
    setLoading(false)
  }

  function toggle(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id); else s.add(id)
      return s
    })
  }

  async function enroll() {
    setAdding(true)
    const { error } = await supabase.from('class_students').insert(
      Array.from(selected).map(student_id => ({ class_id: cls.id, student_id }))
    )
    setAdding(false)
    if (error) { toast.error('Failed to enroll students'); return }
    toast.success(`${selected.size} student${selected.size !== 1 ? 's' : ''} enrolled`)
    setOpen(false)
    setSelected(new Set())
    onEnrolled()
  }

  if (!open) {
    return (
      <button
        onClick={openPanel}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
        style={{ background: color }}
      >
        <UserPlus className="w-3.5 h-3.5" /> {t.classes.enroll_student}
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.classes.enroll_students}</p>
        <button onClick={() => { setOpen(false); setSelected(new Set()) }} className="text-xs text-gray-400 hover:text-gray-600">{t.common.cancel}</button>
      </div>

      {loading ? (
        <div className="py-6 text-center"><Loader2 className="w-5 h-5 animate-spin text-gray-300 mx-auto" /></div>
      ) : available.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">
          {t.classes.no_students_tier.replace('this tier', cls.tier)}{' '}
          {t.classes.add_later_hint}
        </p>
      ) : (
        <>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {available.map(s => {
              const sel = selected.has(s.id)
              return (
                <button key={s.id} onClick={() => toggle(s.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    sel ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                  }`}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: sel ? color : '#9CA3AF' }}>
                    {sel ? <Check className="w-4 h-4" /> : initials(s.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.branch}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {selected.size > 0 && (
            <button onClick={enroll} disabled={adding}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: color }}>
              {adding && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.classes.enroll_students} {selected.size} {selected.size !== 1 ? t.classes.student_plural : t.classes.student_singular}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export function ClassDetailView({ cls, roster, sessions, attendanceCounts }: Props) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [tab, setTab] = useState<'roster' | 'sessions'>('roster')
  const router = useRouter()
  const color = TIER_COLORS[cls.tier] || '#6B7280'

  function handleEnrolled() {
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <LogSessionDialog classId={cls.id} defaultTime={cls.schedule_time ?? undefined} />
        <EditClassDialog cls={cls} compact />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {(['roster', 'sessions'] as const).map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === tabKey ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tabKey === 'roster' ? `${t.classes.roster_tab_label} (${roster.length})` : `${t.classes.sessions_tab_label} (${sessions.length})`}
          </button>
        ))}
      </div>

      {tab === 'roster' ? (
        <RosterTab
          roster={roster}
          color={color}
          enrollPanel={
            <EnrollPanel cls={cls} roster={roster} color={color} onEnrolled={handleEnrolled} />
          }
        />
      ) : (
        <SessionsTab sessions={sessions} attendanceCounts={attendanceCounts} classId={cls.id} />
      )}
    </div>
  )
}

function RosterTab({ roster, color, enrollPanel }: { roster: RosterStudent[]; color: string; enrollPanel: React.ReactNode }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  return (
    <div className="space-y-3">
      {enrollPanel}

      {roster.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-12 text-center">
          <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">{t.classes.no_students_enrolled}</p>
          <p className="text-xs text-gray-400 mt-1">{t.classes.use_enroll_hint}</p>
        </div>
      ) : (
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
                {t.classes.profile}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SessionsTab({
  sessions, attendanceCounts, classId,
}: { sessions: SessionRow[]; attendanceCounts: AttendanceCount[]; classId: string }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
        <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">{t.classes.no_sessions}</p>
        <p className="text-xs text-gray-400 mt-1">{t.classes.log_session_hint}</p>
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
                    {counts.present > 0 && <span className="text-xs text-green-700 font-semibold">● {counts.present} {t.classes.present}</span>}
                    {counts.late > 0    && <span className="text-xs text-amber-600 font-semibold">● {counts.late} {t.classes.late}</span>}
                    {counts.absent > 0  && <span className="text-xs text-red-600 font-semibold">● {counts.absent} {t.classes.absent}</span>}
                    {counts.excused > 0 && <span className="text-xs text-gray-500 font-semibold">● {counts.excused} {t.classes.excused}</span>}
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
                  <ClipboardList className="w-3.5 h-3.5" /> {t.classes.attendance}
                </Link>
                <Link href={`/feedback?session=${session.id}`}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  <MessageSquarePlus className="w-3.5 h-3.5" /> {t.classes.log}
                </Link>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
