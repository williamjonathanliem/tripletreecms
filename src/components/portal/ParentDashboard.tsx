'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'
import { TIER_COLORS, SUBJECT_META, type Subject } from '@/types'
import {
  LayoutDashboard, CalendarDays, TrendingUp, CreditCard, Settings,
  LogOut, CheckCircle2, AlertCircle, Clock, BookOpen, MessageCircle,
  ChevronRight, Globe, User, GraduationCap, FileDown,
} from 'lucide-react'
import Image from 'next/image'
import { downloadProgressReport } from '@/components/students/ProgressReportPDF'
import { startNavProgress } from '@/components/layout/NavigationProgress'

type PortalT = Record<string, string>

type AttendanceRow = {
  id: string
  status: string
  note?: string | null
  session: { session_date?: string; session_time?: string; notes?: string | null } | null
  class: { tier?: string; branch?: string } | null
}

type EnrichedChild = {
  id: string
  name: string
  age: number
  tier: string
  branch: string
  subject: Subject
  module_current: number
  module_total: number
  enrolled_date: string
  fee_status: string | null
  fee_note: string | null
  fee_amount: string | null
  fee_due_date: string | null
  teacher_name: string
  teacher_email: string | null
  modules: string[]
  attendance: { present: number; total: number; recent: AttendanceRow[] }
  schedule_day: string | null
  schedule_time: string | null
  parent_contact: string | null
}

function getStatusCfg(t: PortalT) {
  return {
    present: { label: t.status_present, color: '#15803d', bg: '#f0fdf4', dot: '#22c55e' },
    absent:  { label: t.status_absent,  color: '#b91c1c', bg: '#fef2f2', dot: '#ef4444' },
    late:    { label: t.status_late,    color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
    excused: { label: t.status_excused, color: '#1d4ed8', bg: '#eff6ff', dot: '#3b82f6' },
  }
}

function getFeeCfg(t: PortalT) {
  return {
    paid:    { label: t.fee_all_good,     sublabel: t.fee_up_to_date,       color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: CheckCircle2 },
    unpaid:  { label: t.fee_action_needed, sublabel: t.fee_outstanding,      color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: AlertCircle },
    partial: { label: t.fee_partial,       sublabel: t.fee_partial_received,  color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Clock },
  }
}

function formatTime(time: string) {
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

function formatDate(d: string, locale = 'en-MY') {
  return new Date(d + 'T00:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function toWhatsApp(phone: string, name: string, lang: string) {
  const digits = phone.replace(/\D/g, '')
  const intl = digits.startsWith('60') ? digits : `60${digits.replace(/^0/, '')}`
  const msg = lang === 'zh'
    ? `您好，我想联系您关于${name}在Triple Tree的学习进度。`
    : `Hi, I'm reaching out regarding ${name}'s progress at Triple Tree.`
  return `https://wa.me/${intl}?text=${encodeURIComponent(msg)}`
}

function Avatar({ name, color, size = 10 }: { name: string; color: string; size?: number }) {
  return (
    <div className={`w-${size} h-${size} rounded-xl flex items-center justify-center text-white font-black shrink-0`}
      style={{ backgroundColor: color, fontSize: size <= 8 ? 12 : size <= 10 ? 14 : 18 }}>
      {getInitials(name)}
    </div>
  )
}

// ─── Home Tab ────────────────────────────────────────────────────────────────

function HomeTab({ students, onTab, t }: { students: EnrichedChild[]; onTab: (tab: string) => void; t: PortalT }) {
  const quickLinks = [
    { id: 'schedule',   icon: CalendarDays, label: t.quick_schedule,   desc: t.quick_schedule_desc },
    { id: 'progress',   icon: TrendingUp,   label: t.quick_curriculum,  desc: t.quick_curriculum_desc },
    { id: 'attendance', icon: BookOpen,      label: t.quick_attendance,  desc: t.quick_attendance_desc },
    { id: 'fees',       icon: CreditCard,    label: t.quick_fees,        desc: t.quick_fees_desc },
  ]
  const feeCfg = getFeeCfg(t)

  return (
    <div className="space-y-6">
      <div className={`grid gap-4 ${students.length > 1 ? 'lg:grid-cols-2' : ''}`}>
        {students.map(child => {
          const color = TIER_COLORS[child.tier] || SUBJECT_META[child.subject]?.color || '#6B7280'
          const subMeta = SUBJECT_META[child.subject]
          const attPct = child.attendance.total > 0
            ? Math.round((child.attendance.present / child.attendance.total) * 100) : null
          const pct = child.module_total > 0
            ? Math.round((child.module_current / child.module_total) * 100) : 0
          const fee = feeCfg[child.fee_status as keyof typeof feeCfg ?? 'unpaid'] ?? feeCfg.unpaid
          const FeeIcon = fee.icon

          return (
            <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1.5" style={{ background: color }} />
              <div className="p-5 flex items-start gap-4">
                <Avatar name={child.name} color={color} size={12} />
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black text-gray-900">{child.name}</h2>
                  <p className="text-sm text-gray-400">{child.tier} · {child.branch} · {t.age_label} {child.age}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {subMeta && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                        style={{ color: subMeta.color, background: subMeta.bg }}>
                        {subMeta.label}
                      </span>
                    )}
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: color }}>
                      {child.tier}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 px-5 pb-5">
                <button onClick={() => onTab('attendance')}
                  className="rounded-xl p-3 text-center border border-transparent hover:border-gray-200 transition-all"
                  style={{ background: '#f8f9fb' }}>
                  <p className="text-xl font-black" style={{ color }}>{attPct !== null ? `${attPct}%` : '—'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.stat_attendance}</p>
                </button>
                <button onClick={() => onTab('progress')}
                  className="rounded-xl p-3 text-center border border-transparent hover:border-gray-200 transition-all"
                  style={{ background: '#f8f9fb' }}>
                  <p className="text-xl font-black" style={{ color }}>{pct}%</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.stat_progress}</p>
                </button>
                <button onClick={() => onTab('fees')}
                  className="rounded-xl p-3 text-center border transition-all"
                  style={{ background: fee.bg, borderColor: fee.border }}>
                  <FeeIcon className="w-5 h-5 mx-auto" style={{ color: fee.color }} />
                  <p className="text-xs font-bold mt-1" style={{ color: fee.color }}>{fee.label}</p>
                </button>
              </div>

              {child.schedule_day && (
                <div className="mx-5 mb-5 flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
                  style={{ background: `${color}10` }}>
                  <CalendarDays className="w-4 h-4 shrink-0" style={{ color }} />
                  <p className="text-sm font-semibold" style={{ color }}>
                    {t.every_prefix} {child.schedule_day}
                    {child.schedule_time ? ` · ${formatTime(child.schedule_time)}` : ''}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map(({ id, icon: Icon, label, desc }) => (
          <button key={id} onClick={() => onTab(id)}
            className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:shadow-md hover:border-gray-200 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center mb-3 group-hover:bg-blue-50 transition-colors">
              <Icon className="w-4.5 h-4.5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <p className="text-sm font-bold text-gray-800">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────

function ScheduleTab({ students, t, lang }: { students: EnrichedChild[]; t: PortalT; lang: string }) {
  const locale = lang === 'zh' ? 'zh-CN' : 'en-MY'
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-gray-900">{t.schedule_title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">
          {students.length > 1 ? t.schedule_subtitle_many : t.schedule_subtitle_one}
        </p>
      </div>
      <div className={`grid gap-4 ${students.length > 1 ? 'lg:grid-cols-2' : ''}`}>
        {students.map(child => {
          const color = TIER_COLORS[child.tier] || SUBJECT_META[child.subject]?.color || '#6B7280'
          const subMeta = SUBJECT_META[child.subject]
          return (
            <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1.5" style={{ background: color }} />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  <Avatar name={child.name} color={color} size={11} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-900">{child.name}</h3>
                    <p className="text-xs text-gray-400">{child.branch}</p>
                  </div>
                  {subMeta && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ color: subMeta.color, background: subMeta.bg }}>
                      {subMeta.label}
                    </span>
                  )}
                </div>

                {child.schedule_day ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 rounded-2xl"
                      style={{ background: `${color}0d`, border: `1px solid ${color}20` }}>
                      <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 text-white"
                        style={{ backgroundColor: color }}>
                        <span className="text-[10px] font-bold opacity-70">{child.schedule_day.slice(0, 3).toUpperCase()}</span>
                        <CalendarDays className="w-5 h-5 mt-0.5" />
                      </div>
                      <div>
                        <p className="text-base font-black" style={{ color }}>{child.schedule_day}</p>
                        <p className="text-sm text-gray-500">
                          {child.schedule_time ? formatTime(child.schedule_time) : t.time_tba}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{t.recurring_weekly}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: t.label_teacher, value: child.teacher_name },
                        { label: t.label_branch,  value: child.branch },
                        { label: t.label_tier,    value: child.tier, colored: true },
                        { label: t.label_enrolled, value: child.enrolled_date ? formatDate(child.enrolled_date, locale) : '—' },
                      ].map(({ label, value, colored }) => (
                        <div key={label} className="rounded-xl px-3.5 py-3 bg-gray-50">
                          <p className="text-xs text-gray-400 font-medium">{label}</p>
                          <p className="text-sm font-bold mt-0.5" style={colored ? { color } : { color: '#1f2937' }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {child.parent_contact && (
                      <a href={toWhatsApp(child.parent_contact, child.name, lang)}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
                        style={{ background: '#25D366' }}>
                        <MessageCircle className="w-4 h-4" />
                        {t.contact_whatsapp}
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <CalendarDays className="w-8 h-8 text-gray-200" />
                    <p className="text-sm text-gray-400">{t.no_schedule}</p>
                    <p className="text-xs text-gray-300">{t.no_schedule_hint}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Progress Tab ─────────────────────────────────────────────────────────────

function ProgressTab({ students, t, lang }: { students: EnrichedChild[]; t: PortalT; lang: string }) {
  const [downloading, setDownloading] = useState<string | null>(null)
  const locale = lang === 'zh' ? 'zh-CN' : 'en-MY'

  async function handleDownload(child: EnrichedChild) {
    setDownloading(child.id)
    const present = child.attendance.recent.filter(r => r.status === 'present' || r.status === 'late').length
    await downloadProgressReport({
      studentName: child.name,
      age: child.age,
      tier: child.tier,
      branch: child.branch,
      subject: child.subject,
      teacherName: child.teacher_name,
      enrolledDate: child.enrolled_date ? formatDate(child.enrolled_date, locale) : '—',
      moduleCurrent: child.module_current,
      moduleTotal: child.module_total,
      modules: child.modules,
      attendancePresent: present,
      attendanceTotal: child.attendance.total,
      feeStatus: (child.fee_status ?? 'unpaid') as 'paid' | 'unpaid' | 'partial',
      feeNote: null,
      generatedDate: new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
    })
    setDownloading(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-gray-900">{t.progress_title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{t.progress_subtitle}</p>
      </div>
      <div className={`grid gap-4 ${students.length > 1 ? 'lg:grid-cols-2' : ''}`}>
        {students.map(child => {
          const color = TIER_COLORS[child.tier] || SUBJECT_META[child.subject]?.color || '#6B7280'
          const pct = child.module_total > 0
            ? Math.round((child.module_current / child.module_total) * 100) : 0
          const isComplete = child.module_current >= child.module_total

          return (
            <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1.5" style={{ background: color }} />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  <Avatar name={child.name} color={color} size={11} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-900">{child.name}</h3>
                    <p className="text-xs text-gray-400">
                      {child.tier} · {t.enrolled_prefix} {child.enrolled_date ? formatDate(child.enrolled_date, locale) : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleDownload(child)} disabled={downloading === child.id}
                      className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
                      <FileDown className="w-3 h-3" />
                      {downloading === child.id ? '…' : 'PDF'}
                    </button>
                    {isComplete ? (
                      <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t.done_badge}
                      </span>
                    ) : (
                      <span className="text-lg font-black" style={{ color }}>{pct}%</span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>{t.module_label} {child.module_current} {t.of_label} {child.module_total}</span>
                    <span>{pct}{t.pct_complete}</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
                  </div>
                </div>

                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {child.modules.map((mod, idx) => {
                    const done = idx < child.module_current
                    const current = idx === child.module_current && !isComplete
                    return (
                      <div key={idx} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${current ? 'border' : ''}`}
                        style={current
                          ? { background: `${color}0d`, borderColor: `${color}30` }
                          : { background: done ? 'transparent' : '#f9fafb' }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black"
                          style={done
                            ? { background: `${color}20`, color }
                            : current
                              ? { background: color, color: 'white' }
                              : { background: '#e5e7eb', color: '#9ca3af' }}>
                          {done ? '✓' : idx + 1}
                        </div>
                        <p className={`text-sm flex-1 ${done ? 'text-gray-400 line-through' : current ? 'font-bold' : 'text-gray-500'}`}
                          style={current ? { color } : {}}>
                          {mod}
                        </p>
                        {current && (
                          <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}>
                            {t.now_badge}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────

function AttendanceTab({ students, t }: { students: EnrichedChild[]; t: PortalT }) {
  const [selected, setSelected] = useState(students[0]?.id ?? '')
  const child = students.find(s => s.id === selected) ?? students[0]
  if (!child) return null

  const statusCfg = getStatusCfg(t)
  const color = TIER_COLORS[child.tier] || SUBJECT_META[child.subject]?.color || '#6B7280'
  const attPct = child.attendance.total > 0
    ? Math.round((child.attendance.present / child.attendance.total) * 100) : null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-gray-900">{t.attendance_title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{t.attendance_subtitle}</p>
      </div>

      {students.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {students.map(s => {
            const c = TIER_COLORS[s.tier] || SUBJECT_META[s.subject]?.color || '#6B7280'
            const active = s.id === selected
            return (
              <button key={s.id} onClick={() => setSelected(s.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold transition-all"
                style={active
                  ? { background: c, color: 'white', borderColor: c }
                  : { background: 'white', color: '#6b7280', borderColor: '#e5e7eb' }}>
                {s.name.split(' ')[0]}
              </button>
            )
          })}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3">
          <div className="rounded-2xl p-5 text-white"
            style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}>
            <p className="text-white/70 text-sm font-medium">{child.name}</p>
            <p className="text-5xl font-black mt-2">{attPct !== null ? `${attPct}%` : '—'}</p>
            <p className="text-white/70 text-xs mt-2">
              {child.attendance.present} {t.of_label} {child.attendance.total} {t.sessions_suffix}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
            {(['present', 'absent', 'late', 'excused'] as const).map(status => {
              const count = child.attendance.recent.filter(r => r.status === status).length
              const s = statusCfg[status]
              return (
                <div key={status} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.dot }} />
                    <span className="text-sm text-gray-600">{s.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="font-bold text-gray-800">{t.session_history}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {t.most_recent} {child.attendance.recent.length} {t.sessions_suffix}
            </p>
          </div>
          {child.attendance.recent.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{t.no_sessions}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {child.attendance.recent.map(rec => {
                const s = statusCfg[rec.status as keyof typeof statusCfg]
                  ?? { label: rec.status, color: '#6b7280', bg: '#f9fafb', dot: '#9ca3af' }
                return (
                  <div key={rec.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {rec.session?.session_date ?? '—'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {rec.session?.session_time ? formatTime(rec.session.session_time) : ''}
                        {rec.class?.tier ? ` · ${rec.class.tier}` : ''}
                      </p>
                      {rec.note && <p className="text-xs text-gray-400 italic mt-0.5">{rec.note}</p>}
                      {rec.session?.notes && (
                        <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">{t.teachers_note}</p>
                          <p className="text-xs text-amber-800 italic">&ldquo;{rec.session.notes}&rdquo;</p>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full shrink-0 self-start"
                      style={{ color: s.color, background: s.bg }}>
                      {s.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Fees Tab ─────────────────────────────────────────────────────────────────

function FeesTab({ students, t, lang }: { students: EnrichedChild[]; t: PortalT; lang: string }) {
  const feeCfg = getFeeCfg(t)
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-gray-900">{t.fees_title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{t.fees_subtitle}</p>
      </div>
      <div className={`grid gap-4 ${students.length > 1 ? 'lg:grid-cols-2' : 'max-w-lg'}`}>
        {students.map(child => {
          const color = TIER_COLORS[child.tier] || SUBJECT_META[child.subject]?.color || '#6B7280'
          const fee = feeCfg[child.fee_status as keyof typeof feeCfg ?? 'unpaid'] ?? feeCfg.unpaid
          const FeeIcon = fee.icon

          return (
            <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-1.5" style={{ background: color }} />
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar name={child.name} color={color} size={11} />
                  <div>
                    <h3 className="font-black text-gray-900">{child.name}</h3>
                    <p className="text-xs text-gray-400">{child.tier} · {child.branch}</p>
                  </div>
                </div>

                <div className="rounded-2xl p-4 border" style={{ background: fee.bg, borderColor: fee.border }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `${fee.color}20` }}>
                      <FeeIcon className="w-6 h-6" style={{ color: fee.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-black" style={{ color: fee.color }}>{fee.label}</p>
                      <p className="text-sm mt-0.5" style={{ color: `${fee.color}99` }}>{fee.sublabel}</p>
                    </div>
                    {child.fee_amount && (
                      <div className="text-right shrink-0">
                        <p className="text-xl font-black" style={{ color: fee.color }}>
                          RM {parseFloat(child.fee_amount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        {child.fee_due_date && child.fee_status !== 'paid' && (
                          <p className="text-[11px] mt-0.5" style={{ color: `${fee.color}99` }}>
                            {lang === 'zh' ? '到期：' : 'Due: '}{formatDate(child.fee_due_date)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {child.fee_note && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: fee.border }}>
                      <p className="text-xs font-semibold" style={{ color: fee.color }}>{t.note_from_hr}</p>
                      <p className="text-sm mt-1" style={{ color: `${fee.color}cc` }}>{child.fee_note}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {child.parent_contact && (
                    <a href={toWhatsApp(child.parent_contact, child.name, lang)}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
                      style={{ background: '#25D366' }}>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" />
                        {t.contact_via_whatsapp}
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-70" />
                    </a>
                  )}
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">{t.label_teacher}</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{child.teacher_name}</p>
                    </div>
                    {child.teacher_email && (
                      <a href={`mailto:${child.teacher_email}`}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg"
                        style={{ color, background: `${color}15` }}>
                        {t.label_email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ parentEmail, lang, toggle, onSignOut, signingOut, t }: {
  parentEmail: string; lang: string; toggle: () => void; onSignOut: () => void; signingOut: boolean; t: PortalT
}) {
  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <h2 className="text-lg font-black text-gray-900">{t.settings_title}</h2>
        <p className="text-sm text-gray-400 mt-0.5">{t.settings_subtitle}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
            <User className="w-7 h-7 text-gray-400" />
          </div>
          <div>
            <p className="font-black text-gray-900">{t.parent_account}</p>
            <p className="text-sm text-gray-400 mt-0.5">{parentEmail}</p>
            <span className="inline-block mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {t.readonly_access}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3 border-b border-gray-50">
          {t.preferences}
        </p>
        <button onClick={toggle}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
              <Globe className="w-4.5 h-4.5 text-gray-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">{t.display_language}</p>
              <p className="text-xs text-gray-400">{lang === 'en' ? t.lang_english : t.lang_chinese}</p>
            </div>
          </div>
          <span className="text-sm font-bold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600">
            {lang === 'en' ? '中文' : 'EN'}
          </span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-5 py-3 border-b border-gray-50">
          {t.about}
        </p>
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
            <GraduationCap className="w-4.5 h-4.5 text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Triple Tree Enrichment</p>
            <p className="text-xs text-gray-400">{t.portal_version}</p>
          </div>
        </div>
      </div>

      <button onClick={onSignOut} disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-100 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors disabled:opacity-60">
        {signingOut
          ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
          : <LogOut className="w-4 h-4" />}
        {signingOut ? t.signing_out : t.sign_out}
      </button>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function ParentDashboard({ students, parentEmail }: {
  students: EnrichedChild[]; parentEmail: string
}) {
  const { lang, toggle } = useCmsLang()
  const t = CMS_T[lang].portal
  const [activeTab, setActiveTab] = useState('home')
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const TABS = [
    { id: 'home',       label: t.tab_home,       Icon: LayoutDashboard },
    { id: 'schedule',   label: t.tab_schedule,   Icon: CalendarDays },
    { id: 'progress',   label: t.tab_progress,   Icon: TrendingUp },
    { id: 'attendance', label: t.tab_attendance, Icon: BookOpen },
    { id: 'fees',       label: t.tab_fees,       Icon: CreditCard },
    { id: 'settings',   label: t.tab_settings,   Icon: Settings },
  ]

  async function signOut() {
    setSigningOut(true)
    startNavProgress()
    await supabase.auth.signOut()
    router.push('/parent-login')
  }

  const firstName = parentEmail.split('@')[0].split('.')[0]
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
  const active = TABS.find(tab => tab.id === activeTab)!

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-gray-100 min-h-screen sticky top-0">
        <div className="px-6 py-5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Triple Tree" width={36} height={36} className="rounded-xl object-contain" />
            <div>
              <p className="text-sm font-black text-gray-900">Triple Tree</p>
              <p className="text-xs text-gray-400">{t.portal_label}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={isActive ? { background: '#EBF2FB', color: '#1A5276' } : { color: '#6b7280' }}>
                <Icon className="w-4.5 h-4.5 shrink-0" />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="px-3 pb-4 border-t border-gray-50 pt-4 space-y-1">
          <div className="px-3 py-2.5 rounded-xl bg-gray-50">
            <p className="text-xs font-bold text-gray-700 truncate">{displayName}</p>
            <p className="text-[11px] text-gray-400 truncate">{parentEmail}</p>
          </div>
          <button onClick={signOut} disabled={signingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60">
            {signingOut
              ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin shrink-0" />
              : <LogOut className="w-4 h-4 shrink-0" />}
            {signingOut ? t.signing_out : t.sign_out}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-gray-100 shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Triple Tree" width={28} height={28} className="rounded-xl object-contain" />
              <div>
                <p className="text-sm font-black text-gray-900">Triple Tree</p>
                <p className="text-[10px] text-gray-400">{t.portal_label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-gray-700">{displayName}</p>
              <div className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Desktop page title bar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <active.Icon className="w-5 h-5 text-gray-400" />
            <h1 className="text-lg font-black text-gray-900">{active.label}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>
              {students.length} {students.length === 1 ? t.child_linked : t.children_linked}
            </span>
          </div>
        </div>

        {/* Tab content */}
        <main className="flex-1 p-4 lg:p-8">
          {activeTab === 'home'       && <HomeTab students={students} onTab={setActiveTab} t={t} />}
          {activeTab === 'schedule'   && <ScheduleTab students={students} t={t} lang={lang} />}
          {activeTab === 'progress'   && <ProgressTab students={students} t={t} lang={lang} />}
          {activeTab === 'attendance' && <AttendanceTab students={students} t={t} />}
          {activeTab === 'fees'       && <FeesTab students={students} t={t} lang={lang} />}
          {activeTab === 'settings'   && (
            <SettingsTab
              parentEmail={parentEmail}
              lang={lang}
              toggle={toggle}
              onSignOut={signOut}
              signingOut={signingOut}
              t={t}
            />
          )}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg">
        <div className="flex items-center justify-around px-1 py-2">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[52px] transition-colors"
                style={isActive ? { background: '#EBF2FB' } : {}}>
                <Icon className="w-5 h-5" style={{ color: isActive ? '#1A5276' : '#9ca3af' }} />
                <span className="text-[9px] font-bold" style={{ color: isActive ? '#1A5276' : '#9ca3af' }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      <div className="lg:hidden h-20" />
    </div>
  )
}
