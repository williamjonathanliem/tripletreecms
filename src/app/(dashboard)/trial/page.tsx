import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTeacherContext } from '@/lib/teacher'
import { TrialStudentList } from '@/components/trial/TrialStudentList'
import { AddTrialDialog } from '@/components/trial/AddTrialDialog'
import { PageHeading } from '@/components/ui/PageHeading'

export default async function TrialPage() {
  const supabase = await createClient()
  const ctx = await getTeacherContext()
  if (!ctx) redirect('/login')

  const query = supabase.from('trial_students').select('*').order('trial_date', { ascending: false })
  const { data: trials } = ctx.role === 'hr'
    ? await query
    : await query.eq('teacher_id', ctx.id)

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <PageHeading variant="trial" count={trials?.length ?? 0} />
        <AddTrialDialog />
      </div>
      <TrialStudentList trials={trials ?? []} />
    </div>
  )
}
