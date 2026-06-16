import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClassLogView } from '@/components/feedback/ClassLogView'

export default async function FeedbackPage({
  searchParams,
}: { searchParams: { class?: string; tab?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: classes }, { data: allLogs }] = await Promise.all([
    supabase
      .from('classes')
      .select('id, tier, branch, schedule_day, schedule_time')
      .eq('teacher_id', user.id)
      .order('tier'),
    supabase
      .from('class_feedback')
      .select('*, class:classes(tier, branch)')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  return (
    <ClassLogView
      classes={classes ?? []}
      allLogs={allLogs ?? []}
      defaultClassId={searchParams.class}
      defaultTab={(searchParams.tab as 'log' | 'history') ?? 'log'}
    />
  )
}
