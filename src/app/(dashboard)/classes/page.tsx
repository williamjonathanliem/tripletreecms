import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTeacherContext } from '@/lib/teacher'
import { ClassList } from '@/components/classes/ClassList'
import { AddClassDialog } from '@/components/classes/AddClassDialog'
import { PageHeading } from '@/components/ui/PageHeading'

export default async function ClassesPage() {
  const supabase = await createClient()
  const ctx = await getTeacherContext()
  if (!ctx) redirect('/login')

  const classQuery = supabase.from('classes').select('*').order('created_at', { ascending: false })
  const { data: classes } = ctx.role === 'hr'
    ? await classQuery
    : await classQuery.eq('teacher_id', ctx.id)

  const classIds = (classes ?? []).map(c => c.id)

  const [{ data: rosterCounts }, { data: sessionCounts }] = await Promise.all([
    supabase.from('class_students').select('class_id').in('class_id', classIds),
    ctx.role === 'hr'
      ? supabase.from('class_sessions').select('class_id').in('class_id', classIds)
      : supabase.from('class_sessions').select('class_id').eq('teacher_id', ctx.id).in('class_id', classIds),
  ])

  const classesWithCounts = (classes ?? []).map(cls => ({
    ...cls,
    student_count: (rosterCounts ?? []).filter(r => r.class_id === cls.id).length,
    session_count: (sessionCounts ?? []).filter(s => s.class_id === cls.id).length,
  }))

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <PageHeading variant="classes" count={classes?.length ?? 0} />
        <AddClassDialog />
      </div>
      <ClassList classes={classesWithCounts} />
    </div>
  )
}
