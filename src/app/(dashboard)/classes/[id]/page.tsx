import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { ClassDetailView } from '@/components/classes/ClassDetailView'
import { TIER_COLORS } from '@/types'

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cls } = await supabase
    .from('classes').select('*')
    .eq('id', params.id).eq('teacher_id', user.id).single()
  if (!cls) notFound()

  // Roster
  const { data: rosterData } = await supabase
    .from('class_students')
    .select('student_id, student:students(id, name, tier, branch)')
    .eq('class_id', cls.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roster = (rosterData ?? []).map(r => r.student as any as { id: string; name: string; tier: string; branch: string })

  // Sessions with attendance summary
  const { data: sessions } = await supabase
    .from('class_sessions')
    .select('*')
    .eq('class_id', cls.id)
    .order('session_date', { ascending: false })
    .order('session_time', { ascending: false })

  const sessionIds = (sessions ?? []).map(s => s.id)

  const { data: attendanceCounts } = sessionIds.length > 0
    ? await supabase.from('attendance').select('session_id, status').in('session_id', sessionIds)
    : { data: [] }

  const color = TIER_COLORS[cls.tier] || '#6B7280'

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-5">
      <Link href="/classes" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Classes
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-1.5 w-full" style={{ background: color }} />
        <div className="px-6 py-5 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{cls.tier}</h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-gray-500">
              <span className="font-semibold px-2 py-0.5 rounded-full text-white text-xs"
                style={{ backgroundColor: color }}>{cls.branch}</span>
              {cls.schedule_day && <span>{cls.schedule_day}</span>}
              {cls.schedule_time && <span>{cls.schedule_time.slice(0, 5)}</span>}
              <span>{roster.length} student{roster.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <ClassDetailView
        cls={cls}
        roster={roster}
        sessions={sessions ?? []}
        attendanceCounts={attendanceCounts ?? []}
      />
    </div>
  )
}
