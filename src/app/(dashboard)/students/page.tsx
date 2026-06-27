import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTeacherContext } from '@/lib/teacher'
import { StudentTable } from '@/components/students/StudentTable'
import { AddStudentDialog } from '@/components/students/AddStudentDialog'
import { PageHeading } from '@/components/ui/PageHeading'

export default async function StudentsPage() {
  const supabase = await createClient()
  const ctx = await getTeacherContext()
  if (!ctx) redirect('/login')

  const query = supabase.from('students').select('*').order('name')
  const { data: students } = ctx.role === 'hr'
    ? await query
    : await query.eq('teacher_id', ctx.id)

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <PageHeading variant="students" count={students?.length ?? 0} />
        <AddStudentDialog />
      </div>
      <StudentTable students={students ?? []} />
    </div>
  )
}
