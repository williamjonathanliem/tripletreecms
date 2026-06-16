import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ChevronLeft, CalendarDays, Clock } from 'lucide-react'
import Link from 'next/link'
import { AttendanceSheet } from '@/components/classes/AttendanceSheet'
import { TIER_COLORS } from '@/types'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

export default async function SessionAttendancePage({
  params,
}: { params: { id: string; sessionId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch session
  const { data: session } = await supabase
    .from('class_sessions').select('*')
    .eq('id', params.sessionId).eq('teacher_id', user.id).single()
  if (!session) notFound()

  // Fetch parent class
  const { data: cls } = await supabase
    .from('classes').select('*')
    .eq('id', params.id).eq('teacher_id', user.id).single()
  if (!cls) notFound()

  // Fetch roster
  const { data: rosterData } = await supabase
    .from('class_students')
    .select('student_id, student:students(id, name, tier, branch)')
    .eq('class_id', cls.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roster = (rosterData ?? []).map(r => r.student as any as { id: string; name: string; tier: string; branch: string })

  // Existing attendance for this session
  const { data: existing } = await supabase
    .from('attendance').select('student_id, status')
    .eq('session_id', session.id)

  const color = TIER_COLORS[cls.tier] || '#6B7280'

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-5">
      <Link href={`/classes/${cls.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors">
        <ChevronLeft className="w-4 h-4" /> {cls.tier} — {cls.branch}
      </Link>

      {/* Session header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: color }} />
        <div className="px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900">Attendance</h1>
          <div className="flex items-center gap-4 mt-1.5 text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" /> {formatDate(session.session_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> {formatTime(session.session_time)}
            </span>
            <span className="font-semibold text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: color }}>{cls.branch}</span>
          </div>
          {session.notes && (
            <p className="text-sm text-gray-400 italic mt-2">{session.notes}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">{roster.length} student{roster.length !== 1 ? 's' : ''} on roster</p>
        </div>
      </div>

      <AttendanceSheet
        sessionId={session.id}
        classId={cls.id}
        roster={roster}
        existing={(existing ?? []).map(e => ({ student_id: e.student_id, status: e.status as 'present' | 'late' | 'absent' | 'excused' }))}
      />
    </div>
  )
}
