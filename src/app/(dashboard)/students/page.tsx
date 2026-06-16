import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StudentTable } from '@/components/students/StudentTable'
import { AddStudentDialog } from '@/components/students/AddStudentDialog'

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('teacher_id', user.id)
    .order('name')

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">{students?.length ?? 0} enrolled students</p>
        </div>
        <AddStudentDialog />
      </div>
      <StudentTable students={students ?? []} />
    </div>
  )
}
