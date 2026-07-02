import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTeacherContext } from '@/lib/teacher'
import { HRView } from '@/components/hr/HRView'
import type { Teacher, ScheduleEvent, Subject, Announcement } from '@/types'
import type { HRStudent } from '@/components/hr/HRPaymentsTab'

export default async function HRPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await getTeacherContext()
  if (!ctx || ctx.role !== 'hr') redirect('/dashboard')

  const supabase = await createClient()
  const params = await searchParams

  const [
    { data: teachers },
    { data: allStudents },
    { data: classes },
    { data: events },
    { data: announcements },
    { data: branches },
    { count: trialCount },
    { count: submissionsCount },
    { count: parentsCount },
  ] = await Promise.all([
    supabase.from('teachers').select('*').order('created_at'),
    supabase.from('students').select('id, name, age, tier, branch, subject, fee_status, fee_note, fee_amount, fee_due_date, enrolled_date, teacher_id, parent_contact, parent_email').order('name'),
    supabase.from('classes').select('id, tier, branch, subject').order('created_at'),
    supabase.from('schedule_events').select('*').order('event_date').order('start_time'),
    supabase.from('announcements').select('*').order('created_at', { ascending: false }),
    supabase.from('branches').select('*').order('name'),
    supabase.from('trial_students').select('*', { count: 'exact', head: true }),
    supabase.from('form_submissions').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).not('parent_email', 'is', null),
  ])

  const teacherMap = Object.fromEntries((teachers ?? []).map(t => [t.id, t.name]))
  const hrStudents: HRStudent[] = (allStudents ?? []).map(s => ({
    id: s.id,
    name: s.name,
    age: s.age,
    tier: s.tier,
    branch: s.branch,
    subject: s.subject as Subject,
    fee_status: (s.fee_status ?? 'unpaid') as 'paid' | 'unpaid' | 'partial',
    fee_note: s.fee_note ?? null,
    fee_amount: (s as Record<string, unknown>).fee_amount as string | null ?? null,
    fee_due_date: (s as Record<string, unknown>).fee_due_date as string | null ?? null,
    enrolled_date: s.enrolled_date,
    teacher_id: s.teacher_id,
    teacher_name: teacherMap[s.teacher_id] ?? 'Unknown',
    parent_contact: (s as Record<string, unknown>).parent_contact as string | null ?? null,
    parent_email: (s as Record<string, unknown>).parent_email as string | null ?? null,
  }))

  const allSubjects: Subject[] = ['coding', 'chinese', 'english', 'maths', 'science', 'calligraphy', 'arts']

  const teacherSubjectCounts = Object.fromEntries(
    allSubjects.map(s => [s, (teachers ?? []).filter(t => (t.subjects ?? []).includes(s)).length])
  ) as Record<Subject, number>

  const classSubjectCounts = Object.fromEntries(
    allSubjects.map(s => [s, (classes ?? []).filter(c => c.subject === s).length])
  ) as Record<Subject, number>

  const today = new Date()
  const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7)
  const upcomingThisWeek = (events ?? []).filter(e => {
    const d = new Date(e.event_date)
    return d >= today && d <= weekEnd
  }).length

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
      <HRView
        defaultTab={params?.tab ?? 'overview'}
        teachers={(teachers ?? []) as Teacher[]}
        classes={(classes ?? []) as { id: string; tier: string; branch: string; subject: Subject }[]}
        events={(events ?? []) as ScheduleEvent[]}
        announcements={(announcements ?? []) as Announcement[]}
        teacherSubjectCounts={teacherSubjectCounts}
        classSubjectCounts={classSubjectCounts}
        totalStudents={allStudents?.length ?? 0}
        upcomingThisWeek={upcomingThisWeek}
        totalTrials={trialCount ?? 0}
        totalSubmissions={submissionsCount ?? 0}
        totalParentsWithEmail={parentsCount ?? 0}
        currentUserName={ctx.name}
        hrStudents={hrStudents}
        branches={(branches ?? []) as { id: string; name: string; active: boolean; created_at: string }[]}
      />
    </div>
  )
}
