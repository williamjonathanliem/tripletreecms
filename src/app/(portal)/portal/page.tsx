import { createClient } from '@/lib/supabase/server'
import { getParentContext } from '@/lib/parent'
import { redirect } from 'next/navigation'
import { ParentDashboard } from '@/components/portal/ParentDashboard'
import { CURRICULUM } from '@/lib/curriculum'
import type { Subject } from '@/types'

export default async function PortalPage() {
  const ctx = await getParentContext()
  if (!ctx) redirect('/parent-login')

  const supabase = await createClient()

  const { data: children } = await supabase
    .from('students')
    .select('*')
    .eq('parent_email', ctx.email)
    .order('name')

  if (!children || children.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No students linked to this account.</p>
          <p className="text-gray-400 text-xs mt-1">Contact Triple Tree to set up your access.</p>
        </div>
      </div>
    )
  }

  const teacherIds = Array.from(new Set(children.map(c => c.teacher_id)))

  const [{ data: teachers }, { data: allClasses }] = await Promise.all([
    supabase.from('teachers').select('id, name, email').in('id', teacherIds),
    supabase.from('classes').select('id, teacher_id, tier, branch, schedule_day, schedule_time').in('teacher_id', teacherIds),
  ])

  const teacherMap = Object.fromEntries((teachers ?? []).map(t => [t.id, t]))

  const attendanceByChild: Record<string, { present: number; total: number; recent: unknown[] }> = {}
  for (const child of children) {
    const { data: records } = await supabase
      .from('attendance')
      .select('*, session:class_sessions(session_date, session_time, notes), class:classes(tier, branch)')
      .eq('student_id', child.id)
      .order('created_at', { ascending: false })
      .limit(20)

    const all = records ?? []
    const present = all.filter(r => r.status === 'present' || r.status === 'late').length
    attendanceByChild[child.id] = { present, total: all.length, recent: all }
  }

  const enriched = children.map(c => {
    const teacher = teacherMap[c.teacher_id]
    const classInfo = (allClasses ?? []).find(
      cl => cl.teacher_id === c.teacher_id && cl.tier === c.tier && cl.branch === c.branch
    )
    return {
      ...c,
      subject: c.subject as Subject,
      teacher_name: teacher?.name ?? 'Your Teacher',
      teacher_email: teacher?.email ?? null,
      modules: CURRICULUM[c.tier] ?? [],
      attendance: attendanceByChild[c.id] ?? { present: 0, total: 0, recent: [] },
      schedule_day: classInfo?.schedule_day ?? null,
      schedule_time: classInfo?.schedule_time ?? null,
    }
  })

  return <ParentDashboard students={enriched} parentEmail={ctx.email} />
}
