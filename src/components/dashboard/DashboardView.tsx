'use client'

import Link from 'next/link'
import { Users, UserPlus, CalendarDays, TrendingUp, ArrowRight, MessageSquare, Clock } from 'lucide-react'
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

function getGreeting(lang: string) {
  const h = new Date().getHours()
  if (lang === 'zh') {
    if (h < 12) return '早上好'
    if (h < 17) return '下午好'
    return '晚上好'
  }
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({
  label, value, icon: Icon, color, bg, sub, href,
}: {
  label: string; value: string | number; icon: LucideIcon; color: string; bg: string; sub?: string; href?: string
}) {
  const inner = (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-100 shadow-sm h-full flex flex-col gap-2.5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-none tabular-nums">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-1">
          {label}
          {sub && <span className="text-gray-400"> · {sub}</span>}
        </p>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full hover:scale-[1.01] transition-transform active:scale-[0.99]">
        {inner}
      </Link>
    )
  }
  return inner
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
  const firstName = teacherName.split(' ')[0]

  return (
    <div className="min-h-full">
      {/* Hero header — colored band at top */}
      <div className="bg-[#1A5276] px-5 pt-6 pb-8 md:px-8 md:pt-8 md:pb-10">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm text-blue-200 font-medium mb-0.5">{formatDate(new Date(), lang)}</p>
            <h1 className="text-xl md:text-2xl font-bold text-white leading-snug">
              {getGreeting(lang)}, {firstName}
            </h1>
          </div>
          {subjects.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {subjects.map((s: Subject) => (
                <SubjectBadge key={s} subject={s} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats row — pulls up over the header */}
      <div className="px-4 md:px-6 lg:px-8 -mt-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label={d.stat_students} value={totalStudents}
            icon={Users} color="#1A5276" bg="#EBF5FB"
            href="/students"
          />
          <StatCard
            label={d.stat_trial} value={trialStudents}
            icon={UserPlus} color="#B7770D" bg="#FEF9E7"
            href="/trial"
          />
          <StatCard
            label={d.stat_attendance} value={`${attendanceRate}%`}
            icon={TrendingUp} color="#1E8449" bg="#EAFAF1"
            sub={d.this_week}
          />
          <StatCard
            label={d.stat_classes} value={todaySessions.length}
            icon={CalendarDays} color="#6C3483" bg="#F5EEF8"
            sub={d.today}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 md:px-6 lg:px-8 py-5 max-w-6xl mx-auto space-y-4">

        {/* Announcements */}
        <AnnouncementBanner announcements={announcements} />

        {/* Today's schedule — full width, prominent */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-50 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-[#6C3483]" />
              </div>
              <h2 className="text-sm font-semibold text-gray-900">{d.todays_classes}</h2>
              {todaySessions.length > 0 && (
                <span className="text-xs font-semibold bg-[#F5EEF8] text-[#6C3483] rounded-full px-2 py-0.5 tabular-nums">
                  {todaySessions.length}
                </span>
              )}
            </div>
            <Link
              href="/classes"
              className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors"
            >
              {d.all_classes} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="px-4 pb-4">
            {todaySessions.length === 0 ? (
              <div className="py-8 text-center">
                <CalendarDays className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">{d.no_sessions_today}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todaySessions.map(session => {
                  const cls = session.class
                  const color = TIER_COLORS[cls?.tier ?? ''] || '#6B7280'
                  const timeStr = session.session_time.slice(0, 5)
                  return (
                    <div
                      key={session.id}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold"
                        style={{ backgroundColor: color + '20', color }}
                      >
                        {timeStr}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{cls?.tier ?? '—'}</p>
                        <p className="text-xs text-gray-500">{cls?.branch}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Link
                          href={`/classes/${cls?.id}/sessions/${session.id}`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          style={{ background: '#EAFAF1', color: '#1E8449' }}
                        >
                          {d.attendance_link}
                        </Link>
                        <Link
                          href={`/feedback?session=${session.id}`}
                          className="hidden sm:flex text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                        >
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

        {/* Recent Students + Recent Feedback — side by side on md+ */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Recent Students */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#EBF5FB] flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-[#1A5276]" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">{d.recent_students}</h2>
              </div>
              <Link href="/students" className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
                {d.view_all} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="px-5 pb-3">
              {recentStudents.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{d.no_students_yet}</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentStudents.map(student => {
                    const color = TIER_COLORS[student.tier] || '#6B7280'
                    const progress = student.module_total > 0 ? (student.module_current / student.module_total) * 100 : 0
                    return (
                      <Link key={student.id} href={`/students/${student.id}`} className="flex items-center gap-3 py-3 group">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          {getInitials(student.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-[#1E8449] transition-colors truncate">
                              {student.name}
                            </p>
                            <span className="text-xs text-gray-400 shrink-0 ml-2 tabular-nums">
                              {student.module_current}/{student.module_total}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
                            </div>
                            <span className="text-[10px] text-gray-400 shrink-0 tabular-nums">{Math.round(progress)}%</span>
                          </div>
                        </div>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          {student.tier}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Class Log */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">{d.recent_log}</h2>
              </div>
              <Link href="/feedback?tab=history" className="text-xs text-gray-400 hover:text-gray-700 flex items-center gap-1 transition-colors">
                {d.view_all} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="px-4 pb-4">
              {recentFeedback.length === 0 ? (
                <div className="py-8 text-center">
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
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: color }}
                          >
                            {tier}
                          </span>
                          {branch && <span className="text-xs text-gray-400">{branch}</span>}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{fb.how_was_class}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
