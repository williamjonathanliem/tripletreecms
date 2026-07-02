'use client'

import { useRouter } from 'next/navigation'
import { Users, GraduationCap, CalendarDays, Calendar, ArrowRight, FlaskConical, FileText, Mail } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { InviteTeacherDialog } from './InviteTeacherDialog'
import { SubjectBadge } from '@/components/ui/SubjectBadge'
import { SUBJECTS, SUBJECT_META, type Subject } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

function StatCard({ label, value, icon: Icon, color, bg }: {
  label: string; value: number; icon: LucideIcon; color: string; bg: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-center">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
      </div>
    </div>
  )
}

interface Props {
  totalTeachers: number
  totalStudents: number
  totalClasses: number
  upcomingThisWeek: number
  totalTrials: number
  totalSubmissions: number
  totalParentsWithEmail: number
  teacherSubjectCounts: Record<Subject, number>
  onSwitchTab: (tab: string) => void
}

export function OverviewTab({
  totalTeachers, totalStudents, totalClasses, upcomingThisWeek,
  totalTrials, totalSubmissions, totalParentsWithEmail,
  teacherSubjectCounts, onSwitchTab,
}: Props) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Header row with invite CTA */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {totalTeachers} staff · {totalStudents} students · {totalClasses} classes · {totalTrials} trials
          </p>
        </div>
        <InviteTeacherDialog onInvited={() => router.refresh()} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={t.hr_overview.stat_teachers}   value={totalTeachers}        icon={Users}         color="#1A5276" bg="#EBF5FB" />
        <StatCard label={t.hr_overview.stat_students}   value={totalStudents}         icon={GraduationCap} color="#1E8449" bg="#EAFAF1" />
        <StatCard label={t.hr_overview.stat_classes}    value={totalClasses}          icon={CalendarDays}  color="#6C3483" bg="#F5EEF8" />
        <StatCard label={t.hr_overview.stat_events}     value={upcomingThisWeek}      icon={Calendar}      color="#B7770D" bg="#FEF9E7" />
        <StatCard label={t.hr_overview.stat_trials}     value={totalTrials}           icon={FlaskConical}  color="#0E7490" bg="#ECFEFF" />
        <StatCard label={t.hr_overview.stat_submissions} value={totalSubmissions}     icon={FileText}      color="#B45309" bg="#FFFBEB" />
        <StatCard label={t.hr_overview.stat_parents}    value={totalParentsWithEmail} icon={Mail}          color="#7C3AED" bg="#F5F3FF" />
      </div>

      {/* Teachers by subject */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{t.hr_overview.teachers_by_subject}</h3>
          <button
            onClick={() => onSwitchTab('subjects')}
            className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            {t.hr_overview.details} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          {SUBJECTS.map(s => {
            const meta = SUBJECT_META[s]
            const count = teacherSubjectCounts[s] ?? 0
            return (
              <div key={s} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                <SubjectBadge subject={s} />
                <span className="text-sm font-bold tabular-nums" style={{ color: meta.color }}>
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
