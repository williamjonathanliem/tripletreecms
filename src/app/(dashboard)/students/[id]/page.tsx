import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getTeacherContext } from '@/lib/teacher'
import { StudentDetailView } from '@/components/students/StudentDetailView'
import { CURRICULUM } from '@/lib/curriculum'
import { type Subject } from '@/types'

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const ctx = await getTeacherContext()
  if (!ctx) redirect('/login')

  const supabase = await createClient()

  const studentQuery = supabase
    .from('students')
    .select('*')
    .eq('id', params.id)

  const { data: student } = ctx.role === 'hr'
    ? await studentQuery.single()
    : await studentQuery.eq('teacher_id', ctx.id).single()

  if (!student) notFound()

  const { data: teacher } = await supabase
    .from('teachers').select('name').eq('id', student.teacher_id).single()

  const { data: attendanceRecords } = await supabase
    .from('attendance')
    .select('*, session:class_sessions(session_date, session_time), class:classes(tier, branch)')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: dailyAttendance } = await supabase
    .from('student_attendance')
    .select('*')
    .eq('student_id', student.id)

  const modules = CURRICULUM[student.tier] ?? []
  const subject = student.subject as Subject

  return (
    <StudentDetailView
      student={student as Record<string, unknown>}
      teacher={teacher ?? null}
      attendanceRecords={(attendanceRecords ?? []) as Parameters<typeof StudentDetailView>[0]['attendanceRecords']}
      dailyAttendance={(dailyAttendance ?? []) as { id: string; date: string; status: string }[]}
      modules={modules}
      subject={subject}
      isHR={ctx.role === 'hr'}
    />
  )
}
