import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTeacherContext } from '@/lib/teacher'
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar'
import type { Subject } from '@/types'

export default async function SchedulePage() {
  const ctx = await getTeacherContext()
  if (!ctx) redirect('/login')

  const supabase = await createClient()

  const [{ data: events }, { data: classes }, { data: teachers }] = await Promise.all([
    supabase.from('schedule_events').select('*').order('event_date').order('start_time'),
    supabase.from('classes').select('id, tier, branch, subject').order('created_at'),
    supabase.from('teachers').select('id, name, subjects').eq('active', true).order('name'),
  ])

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-5">
      <ScheduleCalendar
        showHeader
        initialEvents={(events ?? []) as Parameters<typeof ScheduleCalendar>[0]['initialEvents']}
        teachers={(teachers ?? []) as { id: string; name: string; subjects: Subject[] }[]}
        classes={(classes ?? []) as { id: string; tier: string; branch: string; subject: Subject }[]}
        canEdit={ctx.role === 'hr'}
        subjectFilter={ctx.role === 'hr' ? undefined : ctx.subjects}
      />
    </div>
  )
}
