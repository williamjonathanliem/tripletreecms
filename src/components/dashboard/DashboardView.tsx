'use client'

import Link from 'next/link'
import { Users, UserPlus, CalendarDays, TrendingUp, ArrowRight, MessageSquare } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { TIER_COLORS, type Subject, type Announcement } from '@/types'
import { SubjectBadge } from '@/components/ui/SubjectBadge'
import { AnnouncementBanner } from '@/components/announcements/AnnouncementBanner'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

function formatDate(date: Date, lang: string) {
  return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-MY', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function StatCard({
  label, value, icon: Icon, color, bg, sub,
}: {
  label: string; value: string | number; icon: LucideIcon; color: string; bg: string; sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-1.5">
          {label}
          {sub && <span className="text-gray-400"> · {sub}</span>}
        </p>
      </div>
    </div>
  )
}

interface DashboardViewProps {
  teacherName: string
  subjects: Subject[]
  totalStudents: number
  trialStudents: number
  attendanceRate: number
  todaySessions: Array<{
    id: string
    session_time: string
    class: { id: string; tier: string; branch: string } | null
  }>
  recentFeedback: Array<{
    id: string
    how_was_class: string
    class: { tier?: string; branch?: string } | null
  }>
  recentStudents: Array<{
    id: string
    name: string
    tier: string
    branch: string
    module_current: number
    module_total: number
  }>
  announcements: Announcement[]
}

export function DashboardView({
  teacherName, subjects, totalStudents, trialStudents, attendanceRate,
  todaySessions, recentFeedback, recentStudents, announcements,
}: DashboardViewProps) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]
  const d = t.dashboard

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-5">
      <AnnouncementBanner announcements={announcements} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {d.hello}, {teacherName} 👋
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{formatDate(new Date(), lang)}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {subjects.map((s: Subject) => (
            <SubjectBadge key={s} subject={s} />
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={d.stat_students} value={totalStudents} icon={Users} color="#1A5276" bg="#EBF5FB" />
        <StatCard label={d.stat_trial} value={trialStudents} icon={UserPlus} color="#B7770D" bg="#FEF9E7" />
        <StatCard label={d.stat_attendance} value={`${attendanceRate}%`} icon={TrendingUp} color="#1E8449" bg="#EAFAF1" sub={d.this_week} />
        <StatCard label={d.stat_classes} value={todaySessions.length} icon={CalendarDays} color="#6C3483" bg="#F5EEF8" sub={d.today} />
      </div>

      {/* Today's Classes + Recent Feedback */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Today's Classes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">{d.todays_classes}</h2>
            <Link href="/classes" className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
              {d.all_classes} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {todaySessions.length === 0 ? (
              <div className="py-7 text-center">
                <CalendarDays className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{d.no_sessions_today}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todaySessions.map(session => {
                  const cls = session.class
                  const color = TIER_COLORS[cls?.tier ?? ''] || '#6B7280'
                  return (
                    <div key={session.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{cls?.tier ?? '—'}</p>
                        <p className="text-xs text-gray-500">{cls?.branch} · {session.session_time.slice(0, 5)}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Link href={`/classes/${cls?.id}/sessions/${session.id}`}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg transition-colors"
                          style={{ background: '#EAFAF1', color: '#1E8449' }}>
                          {d.attendance_link}
                        </Link>
                        <Link href={`/feedback?session=${session.id}`}
                          className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                          {d.feedback_link}
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">{d.recent_log}</h2>
            <Link href="/feedback?tab=history" className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
              {d.view_all} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {recentFeedback.length === 0 ? (
              <div className="py-7 text-center">
                <MessageSquare className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{d.no_feedback}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentFeedback.map(fb => {
                  const cls = fb.class
                  const tier = cls?.tier ?? ''
                  const branch = cls?.branch ?? ''
                  const color = TIER_COLORS[tier] || '#6B7280'
                  return (
                    <div key={fb.id} className="p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
                          {tier}
                        </span>
                        {branch && <span className="text-xs text-gray-400">{branch}</span>}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{fb.how_was_class}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Students */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">{d.recent_students}</h2>
          <Link href="/students" className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
            {d.view_all} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="px-5 py-3">
          {recentStudents.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{d.no_students_yet}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentStudents.map(student => {
                const color = TIER_COLORS[student.tier] || '#6B7280'
                const progress = student.module_total > 0 ? (student.module_current / student.module_total) * 100 : 0
                return (
                  <Link key={student.id} href={`/students/${student.id}`}
                    className="flex items-center gap-4 py-3.5 group">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: color }}>
                      {getInitials(student.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1E8449] transition-colors truncate">
                          {student.name}
                        </p>
                        <span className="text-xs text-gray-400 shrink-0 ml-3 tabular-nums">
                          {student.module_current}/{student.module_total}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 w-8 text-right tabular-nums">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white shrink-0"
                      style={{ backgroundColor: color }}>
                      {student.tier}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
