import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClassList } from '@/components/classes/ClassList'
import { AddClassDialog } from '@/components/classes/AddClassDialog'

export default async function ClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch student counts per class
  const { data: rosterCounts } = await supabase
    .from('class_students')
    .select('class_id')
    .in('class_id', (classes ?? []).map(c => c.id))

  // Fetch session counts per class
  const { data: sessionCounts } = await supabase
    .from('class_sessions')
    .select('class_id')
    .eq('teacher_id', user.id)
    .in('class_id', (classes ?? []).map(c => c.id))

  const classesWithCounts = (classes ?? []).map(cls => ({
    ...cls,
    student_count: (rosterCounts ?? []).filter(r => r.class_id === cls.id).length,
    session_count: (sessionCounts ?? []).filter(s => s.class_id === cls.id).length,
  }))

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-sm text-gray-400 mt-0.5">{classes?.length ?? 0} class group{classes?.length !== 1 ? 's' : ''}</p>
        </div>
        <AddClassDialog />
      </div>
      <ClassList classes={classesWithCounts} />
    </div>
  )
}
