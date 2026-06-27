'use client'

import Link from 'next/link'
import { CalendarDays, Clock, Users, BookOpen } from 'lucide-react'
import { EditClassDialog } from './EditClassDialog'
import { SubjectBadge } from '@/components/ui/SubjectBadge'
import { TIER_COLORS, type ClassGroup, type Subject } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

type ClassGroupWithCounts = ClassGroup & { student_count: number; session_count: number }

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

function ClassCard({ cls }: { cls: ClassGroupWithCounts }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]
  const color = TIER_COLORS[cls.tier] || '#6B7280'
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      <div className="h-1 w-full" style={{ background: color }} />
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <p className="text-sm font-bold text-gray-900">{cls.tier}</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: color }}>
                {cls.branch}
              </span>
              {cls.subject && <SubjectBadge subject={cls.subject as Subject} />}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
              {cls.schedule_day && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> {cls.schedule_day}
                </span>
              )}
              {cls.schedule_time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatTime(cls.schedule_time)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {cls.student_count} {cls.student_count !== 1 ? t.classes.student_plural : t.classes.student_singular}
              </span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> {cls.session_count} {cls.session_count !== 1 ? t.classes.session_plural : t.classes.session_singular}
              </span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Link href={`/classes/${cls.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
              style={{ background: '#EAFAF1', color: '#1E8449' }}>
              {t.classes.view}
            </Link>
            <EditClassDialog cls={cls} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function ClassList({ classes }: { classes: ClassGroupWithCounts[] }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
        <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">{t.classes.no_classes}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {classes.map(cls => <ClassCard key={cls.id} cls={cls} />)}
    </div>
  )
}
