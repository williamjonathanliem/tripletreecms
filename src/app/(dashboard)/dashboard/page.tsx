import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Subject, Announcement } from '@/types'
import { DashboardView } from '@/components/dashboard/DashboardView'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: teacher } = await supabase
    .from('teachers').select('name, role, subjects').eq('id', user.id).single()

  if (teacher?.role === 'hr') redirect('/hr')

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
    { data: announcements },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('teacher_id', user.id),
    supabase.from('trial_students').select('*', { count: 'exact', head: true }).eq('teacher_id', user.id).eq('outcome', 'pending'),
    supabase.from('class_sessions').select('*, class:classes(id, tier, branch)').eq('teacher_id', user.id).eq('session_date', today).order('session_time'),
    supabase.from('students').select('id, name, tier, branch, module_current, module_total').eq('teacher_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('class_feedback').select('*, class:classes(tier, branch)').eq('teacher_id', user.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('class_sessions').select('id').eq('teacher_id', user.id).gte('session_date', weekStart),
    supabase.from('announcements').select('*').order('created_at', { ascending: false }),
  ])

  const weekSessionIds = (weekSessions ?? []).map(s => s.id)
  const { data: weekAttendance } = weekSessionIds.length > 0
    ? await supabase.from('attendance').select('status').in('session_id', weekSessionIds)
    : { data: [] }

  const totalAttendanceRecords = weekAttendance?.length ?? 0
  const presentLate = weekAttendance?.filter(a => a.status === 'present' || a.status === 'late').length ?? 0
  const attendanceRate = totalAttendanceRecords > 0 ? Math.round((presentLate / totalAttendanceRecords) * 100) : 0

  return (
    <DashboardView
      teacherName={teacher?.name ?? 'Teacher'}
      subjects={(teacher?.subjects ?? []) as Subject[]}
      totalStudents={totalStudents ?? 0}
      trialStudents={trialStudents ?? 0}
      attendanceRate={attendanceRate}
      todaySessions={(todaySessions ?? []) as Array<{ id: string; session_time: string; class: { id: string; tier: string; branch: string } | null }>}
      recentFeedback={(recentFeedback ?? []) as Array<{ id: string; how_was_class: string; class: { tier?: string; branch?: string } | null }>}
      recentStudents={(recentStudents ?? []) as Array<{ id: string; name: string; tier: string; branch: string; module_current: number; module_total: number }>}
      announcements={(announcements ?? []) as Announcement[]}
    />
  )
}
