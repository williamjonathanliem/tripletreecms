import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrialStudentList } from '@/components/trial/TrialStudentList'
import { AddTrialDialog } from '@/components/trial/AddTrialDialog'

export default async function TrialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: trials } = await supabase
    .from('trial_students')
    .select('*')
    .eq('teacher_id', user.id)
    .order('trial_date', { ascending: false })

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trial Students</h1>
          <p className="text-sm text-gray-400 mt-0.5">{trials?.length ?? 0} records</p>
        </div>
        <AddTrialDialog />
      </div>
      <TrialStudentList trials={trials ?? []} />
    </div>
  )
}
