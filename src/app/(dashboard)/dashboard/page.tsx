import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, UserPlus, CalendarDays, TrendingUp, ArrowRight, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { TIER_COLORS } from '@/types'

function formatDate(date: Date) {
  return date.toLocaleDateString('en-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function StatCard({
  label, value, icon: Icon, color, bg, sub,
}: {
  label: string; value: string | number; icon: LucideIcon; color: string; bg: string; sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-1.5">
          {label}
          {sub && <span className="text-gray-400"> · {sub}</span>}
        </p>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers').select('name').eq('id', user.id).single()

  const today = new Date().toISOString().split('T')[0]
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1)
  const weekStart = startOfWeek.toISOString().split('T')[0]

  const [
    { count: totalStudents },
    { count: trialStudents },
    { data: todaySessions },
    { data: recentStudents },
    { data: recentFeedback },
    { data: weekSessions },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('teacher_id', user.id),
    supabase.from('trial_students').select('*', { count: 'exact', head: true }).eq('teacher_id', user.id).eq('outcome', 'pending'),
    supabase.from('class_sessions').select('*, class:classes(id, tier, branch)').eq('teacher_id', user.id).eq('session_date', today).order('session_time'),
    supabase.from('students').select('id, name, tier, branch, module_current, module_total').eq('teacher_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('class_feedback').select('*, session:class_sessions(session_date, session_time, class:classes(tier, branch))').eq('teacher_id', user.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('class_sessions').select('id').eq('teacher_id', user.id).gte('session_date', weekStart),
  ])

  const weekSessionIds = (weekSessions ?? []).map(s => s.id)
  const { data: weekAttendance } = weekSessionIds.length > 0
    ? await supabase.from('attendance').select('status').in('session_id', weekSessionIds)
    : { data: [] }

  const totalAttendanceRecords = weekAttendance?.length ?? 0
  const presentLate = weekAttendance?.filter(a => a.status === 'present' || a.status === 'late').length ?? 0
  const attendanceRate = totalAttendanceRecords > 0 ? Math.round((presentLate / totalAttendanceRecords) * 100) : 0

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hello, {teacher?.name ?? 'Teacher'} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{formatDate(new Date())}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Students" value={totalStudents ?? 0} icon={Users} color="#1A5276" bg="#EBF5FB" />
        <StatCard label="Trial Students" value={trialStudents ?? 0} icon={UserPlus} color="#B7770D" bg="#FEF9E7" />
        <StatCard label="Attendance" value={`${attendanceRate}%`} icon={TrendingUp} color="#1E8449" bg="#EAFAF1" sub="this week" />
        <StatCard label="Classes" value={todaySessions?.length ?? 0} icon={CalendarDays} color="#6C3483" bg="#F5EEF8" sub="today" />
      </div>

      {/* Today's Classes + Recent Feedback */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Today's Classes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Today&apos;s Classes</h2>
            <Link href="/classes" className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
              All classes <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {!todaySessions || todaySessions.length === 0 ? (
              <div className="py-7 text-center">
                <CalendarDays className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No sessions today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todaySessions.map(session => {
                  const cls = session.class as { id: string; tier: string; branch: string } | null
                  const color = TIER_COLORS[cls?.tier ?? ''] || '#6B7280'
                  return (
                    <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{cls?.tier ?? '—'}</p>
                        <p className="text-xs text-gray-500">{cls?.branch} · {session.session_time.slice(0, 5)}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Link href={`/classes/${cls?.id}/sessions/${session.id}`}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                          style={{ background: '#EAFAF1', color: '#1E8449' }}>
                          Attendance
                        </Link>
                        <Link href={`/feedback?session=${session.id}`}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                          Feedback
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent Class Log</h2>
            <Link href="/feedback?tab=history" className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {!recentFeedback || recentFeedback.length === 0 ? (
              <div className="py-7 text-center">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No feedback logged yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentFeedback.map(fb => {
                  const sess = fb.session as { session_date?: string; class?: { tier?: string; branch?: string } } | null
                  const tier = sess?.class?.tier ?? ''
                  const date = sess?.session_date ?? ''
                  const color = TIER_COLORS[tier] || '#6B7280'
                  return (
                    <div key={fb.id} className="p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
                          {tier}
                        </span>
                        <span className="text-xs text-gray-400">{date}</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{fb.how_was_class}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Students</h2>
          <Link href="/students" className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="px-5 py-3">
          {!recentStudents || recentStudents.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No students yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentStudents.map(student => {
                const color = TIER_COLORS[student.tier] || '#6B7280'
                const progress = student.module_total > 0 ? (student.module_current / student.module_total) * 100 : 0
                return (
                  <Link key={student.id} href={`/students/${student.id}`}
                    className="flex items-center gap-4 py-3.5 group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: color }}>
                      {getInitials(student.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1E8449] transition-colors truncate">
                          {student.name}
                        </p>
                        <span className="text-xs text-gray-400 shrink-0 ml-3 tabular-nums">
                          {student.module_current}/{student.module_total}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 w-8 text-right tabular-nums">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white shrink-0"
                      style={{ backgroundColor: color }}>
                      {student.tier}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
