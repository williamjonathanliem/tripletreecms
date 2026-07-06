'use client'

import { TeachersTab } from './TeachersTab'
import { SubjectsTab } from './SubjectsTab'
import { OverviewTab } from './OverviewTab'
import { AnnouncementsTab } from './AnnouncementsTab'
import { AnalyticsTab } from './AnalyticsTab'
import { AvailabilityTab } from './AvailabilityTab'
import { FormSubmissionsTab } from './FormSubmissionsTab'
import { BootcampConfirmationTab } from './BootcampConfirmationTab'
import { ScheduleCalendar } from '@/components/schedule/ScheduleCalendar'
import { HRPaymentsTab } from './HRPaymentsTab'
import { ParentsTab } from './ParentsTab'
import { BranchesTab } from './BranchesTab'
import { ParentAnnouncementsTab } from './ParentAnnouncementsTab'
import { SettingsTab } from './SettingsTab'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'
import type { Teacher, ScheduleEvent, Subject, Announcement } from '@/types'
import type { HRStudent } from './HRPaymentsTab'

interface Branch {
  id: string
  name: string
  active: boolean
  created_at: string
}

interface Props {
  defaultTab: string
  teachers: Teacher[]
  classes: { id: string; tier: string; branch: string; subject: Subject }[]
  events: ScheduleEvent[]
  announcements: Announcement[]
  teacherSubjectCounts: Record<Subject, number>
  classSubjectCounts: Record<Subject, number>
  totalStudents: number
  upcomingThisWeek: number
  totalTrials: number
  totalSubmissions: number
  totalParentsWithEmail: number
  currentUserName?: string
  hrStudents: HRStudent[]
  branches: Branch[]
}

export function HRView({
  defaultTab, teachers, classes, events, announcements,
  teacherSubjectCounts, classSubjectCounts,
  totalStudents, upcomingThisWeek,
  totalTrials, totalSubmissions, totalParentsWithEmail,
  currentUserName, hrStudents, branches,
}: Props) {
  const tab = defaultTab || 'overview'
  const { lang } = useCmsLang()
  const t = CMS_T[lang].hr

  const tabKey = `tab_${tab}` as keyof typeof t
  const tabSubKey = `tab_${tab}_sub` as keyof typeof t
  const heading = t[tabKey] ?? t.tab_overview
  const headingSub = t[tabSubKey] ?? t.tab_overview_sub

  const teachersForCalendar = teachers.map(tc => ({
    id: tc.id, name: tc.name, subjects: tc.subjects,
  }))

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{heading}</h1>
        <p className="text-xs md:text-sm text-gray-400 mt-0.5">{headingSub}</p>
      </div>
      {tab === 'overview' && (
        <OverviewTab
          totalTeachers={teachers.length}
          totalStudents={totalStudents}
          totalClasses={classes.length}
          upcomingThisWeek={upcomingThisWeek}
          totalTrials={totalTrials}
          totalSubmissions={totalSubmissions}
          totalParentsWithEmail={totalParentsWithEmail}
          teacherSubjectCounts={teacherSubjectCounts}
          onSwitchTab={() => {}}
        />
      )}

      {tab === 'teachers' && <TeachersTab teachers={teachers} />}

      {tab === 'schedule' && (
        <ScheduleCalendar
          initialEvents={events}
          teachers={teachersForCalendar}
          classes={classes}
          canEdit={true}
        />
      )}

      {tab === 'availability' && <AvailabilityTab teachers={teachers} />}

      {tab === 'subjects' && (
        <SubjectsTab
          teacherSubjectCounts={teacherSubjectCounts}
          classSubjectCounts={classSubjectCounts}
        />
      )}

      {tab === 'announcements'        && <AnnouncementsTab announcements={announcements} />}
      {tab === 'parent-announcements' && <ParentAnnouncementsTab />}

      {tab === 'analytics' && <AnalyticsTab />}

      {tab === 'submissions' && <FormSubmissionsTab teachers={teachers} />}

      {tab === 'confirmation' && (
        <BootcampConfirmationTab
          currentUserName={currentUserName}
          branches={branches.filter(b => b.active).map(b => b.name)}
          tiers={[...new Set(classes.map(c => c.tier).filter(Boolean))].sort()}
        />
      )}

      {tab === 'payments' && (
        <HRPaymentsTab students={hrStudents} hrName={currentUserName ?? 'HR'} />
      )}

      {tab === 'parents' && <ParentsTab />}

      {tab === 'branches'  && <BranchesTab branches={branches} />}
      {tab === 'settings'  && <SettingsTab />}
    </div>
  )
}
