'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'
import { TIER_COLORS, SUBJECT_META, type Subject } from '@/types'
import {
  LayoutDashboard, CalendarDays, TrendingUp, CreditCard,
  LogOut, CheckCircle2, AlertCircle, Clock, BookOpen, MessageCircle,
  Globe, User, GraduationCap, FileDown, ChevronRight, Settings,
  Bell, Award,
} from 'lucide-react'
import Image from 'next/image'
import { downloadProgressReport } from '@/components/students/ProgressReportPDF'
import { startNavProgress } from '@/components/layout/NavigationProgress'

const BRAND  = '#1A5276'
const GREEN  = '#1E8449'

type PortalT = Record<string, string>

type AttendanceRow = {
  id: string; status: string; note?: string | null
  session: { session_date?: string; session_time?: string; notes?: string | null } | null
  class: { tier?: string; branch?: string } | null
}

type EnrichedChild = {
  id: string; name: string; age: number; tier: string; branch: string; subject: Subject
  module_current: number; module_total: number; enrolled_date: string
  fee_status: string | null; fee_note: string | null; fee_amount: string | null; fee_due_date: string | null
  teacher_name: string; teacher_email: string | null; modules: string[]
  attendance: { present: number; total: number; recent: AttendanceRow[] }
  schedule_day: string | null; schedule_time: string | null; parent_contact: string | null
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
    paid:    { label: t.fee_all_good,      sublabel: t.fee_up_to_date,       color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', icon: CheckCircle2 },
    unpaid:  { label: t.fee_action_needed, sublabel: t.fee_outstanding,       color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', icon: AlertCircle  },
    partial: { label: t.fee_partial,       sublabel: t.fee_partial_received,  color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: Clock        },
  }
}

function formatTime(time: string) {
  const [h, m] = time.split(':'); const hour = parseInt(h)
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

function Avatar({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  return (
    <div className="rounded-2xl flex items-center justify-center text-white font-bold shrink-0"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.35 }}>
      {getInitials(name)}
    </div>
  )
}

// ─── Right panel — always visible on xl ──────────────────────────────────────

function RightPanel({ students, activeTab, t, lang }: { students: EnrichedChild[]; activeTab: string; t: PortalT; lang: string }) {
  const [focusId, setFocusId] = useState(students[0]?.id ?? '')
  const child = students.find(s => s.id === focusId) ?? students[0]
  if (!child) return null

  const color = TIER_COLORS[child.tier] || SUBJECT_META[child.subject]?.color || BRAND
  const subMeta = SUBJECT_META[child.subject]
  const pct = child.module_total > 0 ? Math.round((child.module_current / child.module_total) * 100) : 0
  const attPct = child.attendance.total > 0
    ? Math.round((child.attendance.present / child.attendance.total) * 100) : 0
  const daysEnrolled = child.enrolled_date
    ? Math.floor((Date.now() - new Date(child.enrolled_date + 'T00:00:00').getTime()) / 86400000)
    : 0
  const statusCfg = getStatusCfg(t)

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 bg-white border-l border-gray-100 overflow-y-auto">
      {/* Child switcher if multiple */}
      {students.length > 1 && (
        <div className="flex gap-1.5 p-4 border-b border-gray-50">
          {students.map(s => {
            const c = TIER_COLORS[s.tier] || SUBJECT_META[s.subject]?.color || BRAND
            const active = s.id === focusId
            return (
              <button key={s.id} onClick={() => setFocusId(s.id)}
                className="flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={active ? { background: c, color: 'white' } : { background: '#f3f4f6', color: '#9ca3af' }}>
                {s.name.split(' ')[0]}
              </button>
            )
          })}
        </div>
      )}

      {/* Profile card */}
      <div className="shrink-0">
        <div className="h-24 relative" style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}99 100%)` }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="absolute bottom-0 right-4 translate-y-1/2">
            <div className="w-16 h-16 rounded-2xl border-4 border-white flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: color }}>
              {getInitials(child.name)}
            </div>
          </div>
        </div>
        <div className="px-5 pt-12 pb-5">
          <h3 className="font-bold text-gray-900 text-base">{child.name}</h3>
          <p className="text-sm text-gray-400 mt-0.5">{child.tier}</p>
          {subMeta && (
            <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ color: subMeta.color, background: subMeta.bg }}>
              {subMeta.label}
            </span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 px-4 pb-4 shrink-0">
        {[
          { value: child.attendance.present, label: 'Sessions', icon: BookOpen },
          { value: `${pct}%`,               label: 'Curriculum', icon: TrendingUp },
          { value: `${attPct}%`,            label: 'Attendance', icon: Award },
          { value: daysEnrolled,             label: 'Days enrolled', icon: CalendarDays },
        ].map(({ value, label, icon: Icon }) => (
          <div key={label} className="rounded-2xl p-3.5 bg-gray-50">
            <Icon className="w-4 h-4 text-gray-400 mb-1.5" />
            <p className="text-xl font-bold text-gray-900 leading-none">{value}</p>
            <p className="text-[11px] text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Recent sessions */}
      <div className="flex-1 border-t border-gray-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Sessions</p>
        </div>
        <div className="space-y-1 px-3 pb-4">
          {child.attendance.recent.slice(0, 5).length === 0 ? (
            <div className="py-8 text-center">
              <BookOpen className="w-6 h-6 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No sessions yet</p>
            </div>
          ) : child.attendance.recent.slice(0, 5).map(rec => {
            const s = statusCfg[rec.status as keyof typeof statusCfg]
              ?? { label: rec.status, color: '#6b7280', bg: '#f9fafb', dot: '#9ca3af' }
            return (
              <div key={rec.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: s.bg }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dot }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">
                    {rec.session?.session_date ?? '—'}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {rec.session?.session_time ? formatTime(rec.session.session_time) : ''}
                  </p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg shrink-0"
                  style={{ color: s.color, background: s.bg }}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

// ─── Home Tab ────────────────────────────────────────────────────────────────

function HomeTab({ students, onTab, t }: { students: EnrichedChild[]; onTab: (tab: string) => void; t: PortalT }) {
  const feeCfg = getFeeCfg(t)
  const hero = students[0]
  const heroPct = hero && hero.module_total > 0
    ? Math.round((hero.module_current / hero.module_total) * 100) : 0

  return (
    <div className="space-y-8">

      {/* Hero banner */}
      <div className="relative rounded-3xl overflow-hidden p-7 text-white min-h-[160px] flex flex-col justify-between"
        style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${GREEN} 100%)` }}>
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-[0.06] border-[40px] border-white -translate-y-1/2 translate-x-1/4" />
        <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full opacity-[0.06] border-[20px] border-white translate-y-1/3" />
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1.5">Triple Tree Parent Portal</p>
          <h2 className="text-2xl font-bold leading-snug mb-2">
            {hero
              ? `Track ${hero.name.split(' ')[0]}'s Learning Journey`
              : 'Welcome to the Parent Portal'}
          </h2>
          <p className="text-white/70 text-sm mb-5">
            {hero
              ? `${hero.name.split(' ')[0]} is at ${heroPct}% of the ${hero.tier} curriculum`
              : `${students.length} children enrolled at Triple Tree Enrichment`}
          </p>
          <button onClick={() => onTab('progress')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-sm font-semibold rounded-xl hover:bg-white/95 transition-colors"
            style={{ color: BRAND }}>
            View Progress <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Children — course card style */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Your Children</h3>
          <span className="text-sm text-gray-400">{students.length} enrolled</span>
        </div>
        <div className={`grid gap-4 ${students.length > 1 ? 'sm:grid-cols-2' : 'max-w-sm'}`}>
          {students.map(child => {
            const color = TIER_COLORS[child.tier] || SUBJECT_META[child.subject]?.color || BRAND
            const subMeta = SUBJECT_META[child.subject]
            const pct = child.module_total > 0 ? Math.round((child.module_current / child.module_total) * 100) : 0
            const attPct = child.attendance.total > 0
              ? Math.round((child.attendance.present / child.attendance.total) * 100) : null
            const fee = feeCfg[child.fee_status as keyof typeof feeCfg ?? 'unpaid'] ?? feeCfg.unpaid
            const FeeIcon = fee.icon

            return (
              <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                {/* Thumbnail header */}
                <div className="h-32 relative overflow-hidden flex items-end p-4"
                  style={{ background: `linear-gradient(145deg, ${color} 0%, ${color}cc 100%)` }}>
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                  {subMeta && (
                    <span className="relative z-10 text-[11px] font-bold px-2.5 py-1 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(4px)' }}>
                      {subMeta.label}
                    </span>
                  )}
                  <div className="absolute top-3 right-3">
                    <div className="w-10 h-10 rounded-xl border-2 border-white/30 flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: `${color}99` }}>
                      {getInitials(child.name)}
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4 flex-1 flex flex-col gap-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{child.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{child.teacher_name} · {child.branch}</p>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {child.attendance.present} sessions
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      {child.module_current}/{child.module_total} modules
                    </span>
                    <span className="flex items-center gap-1 ml-auto" style={{ color: fee.color }}>
                      <FeeIcon className="w-3.5 h-3.5" />
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
                      <span>Progress: <span className="font-semibold" style={{ color }}>{pct}%</span></span>
                      {attPct !== null && <span>Attendance: {attPct}%</span>}
                    </div>
                  </div>
                </div>

                {/* View detail row */}
                <button onClick={() => onTab('progress')}
                  className="flex items-center justify-between px-4 py-3 border-t border-gray-50 text-xs font-semibold hover:bg-gray-50 transition-colors"
                  style={{ color }}>
                  View details <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick access */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-4">Quick Access</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'schedule',   icon: CalendarDays, label: t.quick_schedule,  color: BRAND,    bg: '#EBF2FB' },
            { id: 'progress',   icon: TrendingUp,   label: t.quick_curriculum, color: GREEN,    bg: '#EAF5EF' },
            { id: 'attendance', icon: BookOpen,      label: t.quick_attendance, color: '#7c3aed', bg: '#f5f3ff' },
            { id: 'fees',       icon: CreditCard,    label: t.quick_fees,       color: '#b45309', bg: '#fffbeb' },
          ].map(({ id, icon: Icon, label, color, bg }) => (
            <button key={id} onClick={() => onTab(id)}
              className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:shadow-md hover:border-gray-200 transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                <Icon className="w-[18px] h-[18px]" style={{ color }} />
              </div>
              <p className="text-sm font-semibold text-gray-800">{label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────

function ScheduleTab({ students, t, lang }: { students: EnrichedChild[]; t: PortalT; lang: string }) {
  const locale = lang === 'zh' ? 'zh-CN' : 'en-MY'
  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-gray-900">{t.schedule_title}</h2>
      <div className={`grid gap-4 ${students.length > 1 ? 'lg:grid-cols-2' : 'max-w-xl'}`}>
        {students.map(child => {
          const color = TIER_COLORS[child.tier] || SUBJECT_META[child.subject]?.color || BRAND
          const subMeta = SUBJECT_META[child.subject]
          return (
            <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="h-2" style={{ background: color }} />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-5">
                  <Avatar name={child.name} color={color} size={44} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{child.name}</h3>
                    <p className="text-xs text-gray-400">{child.branch}</p>
                  </div>
                  {subMeta && (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ color: subMeta.color, background: subMeta.bg }}>
                      {subMeta.label}
                    </span>
                  )}
                </div>

                {child.schedule_day ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 p-4 rounded-2xl"
                      style={{ background: `${color}0a`, border: `1px solid ${color}18` }}>
                      <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: color }}>
                        <span className="text-[9px] font-bold opacity-70 uppercase tracking-wider">{child.schedule_day.slice(0, 3)}</span>
                        <span className="text-base font-bold leading-none mt-0.5">
                          {child.schedule_time ? child.schedule_time.slice(0, 5) : '—'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color }}>{child.schedule_day}</p>
                        <p className="text-sm text-gray-600">{child.schedule_time ? formatTime(child.schedule_time) : t.time_tba}</p>
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
                          <p className="text-[11px] text-gray-400">{label}</p>
                          <p className="text-sm font-semibold mt-0.5" style={colored ? { color } : { color: '#1f2937' }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    {child.teacher_email && (
                      <a href={`mailto:${child.teacher_email}`}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                          <User className="w-4 h-4" style={{ color }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{child.teacher_name}</p>
                          <p className="text-xs text-gray-400">{child.teacher_email}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-1">
                      <CalendarDays className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400">{t.no_schedule}</p>
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
      studentName: child.name, age: child.age, tier: child.tier, branch: child.branch,
      subject: child.subject, teacherName: child.teacher_name,
      enrolledDate: child.enrolled_date ? formatDate(child.enrolled_date, locale) : '—',
      moduleCurrent: child.module_current, moduleTotal: child.module_total, modules: child.modules,
      attendancePresent: present, attendanceTotal: child.attendance.total,
      feeStatus: (child.fee_status ?? 'unpaid') as 'paid' | 'unpaid' | 'partial', feeNote: null,
      generatedDate: new Date().toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
    })
    setDownloading(null)
  }

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-gray-900">{t.progress_title}</h2>
      <div className={`grid gap-4 ${students.length > 1 ? 'lg:grid-cols-2' : 'max-w-xl'}`}>
        {students.map(child => {
          const color = TIER_COLORS[child.tier] || SUBJECT_META[child.subject]?.color || BRAND
          const pct = child.module_total > 0 ? Math.round((child.module_current / child.module_total) * 100) : 0
          const isComplete = child.module_current >= child.module_total
          return (
            <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Banner header */}
              <div className="px-5 pt-5 pb-4 flex items-center gap-3">
                <Avatar name={child.name} color={color} size={44} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{child.name}</h3>
                  <p className="text-xs text-gray-400">{child.tier} · {child.enrolled_date ? formatDate(child.enrolled_date, locale) : '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDownload(child)} disabled={downloading === child.id}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
                    <FileDown className="w-3 h-3" />
                    {downloading === child.id ? '…' : 'PDF'}
                  </button>
                  {isComplete
                    ? <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-xl bg-green-50 text-green-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t.done_badge}
                      </span>
                    : <span className="text-sm font-bold" style={{ color }}>{pct}%</span>
                  }
                </div>
              </div>

              {/* Big progress display */}
              <div className="px-5 pb-5">
                <div className="rounded-2xl p-4 mb-4" style={{ background: `${color}08` }}>
                  <div className="flex items-end justify-between mb-3">
                    <div>
                      <p className="text-3xl font-bold" style={{ color }}>{pct}%</p>
                      <p className="text-xs text-gray-400 mt-0.5">{t.module_label} {child.module_current} {t.of_label} {child.module_total}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{t.pct_complete}</p>
                      <p className="text-sm font-semibold text-gray-700">{child.module_current} done</p>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/80 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
                  </div>
                </div>

                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {child.modules.map((mod, idx) => {
                    const done = idx < child.module_current
                    const current = idx === child.module_current && !isComplete
                    return (
                      <div key={idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={current ? { background: `${color}0d`, outline: `1px solid ${color}25` } : { background: done ? 'transparent' : '#f9fafb' }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold"
                          style={done
                            ? { background: `${color}18`, color }
                            : current ? { background: color, color: 'white' }
                            : { background: '#e5e7eb', color: '#9ca3af' }}>
                          {done ? '✓' : idx + 1}
                        </div>
                        <p className={`text-sm flex-1 ${done ? 'text-gray-300 line-through' : current ? 'font-semibold' : 'text-gray-500'}`}
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
  const color = TIER_COLORS[child.tier] || SUBJECT_META[child.subject]?.color || BRAND
  const attPct = child.attendance.total > 0 ? Math.round((child.attendance.present / child.attendance.total) * 100) : null

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-gray-900">{t.attendance_title}</h2>
      {students.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {students.map(s => {
            const c = TIER_COLORS[s.tier] || SUBJECT_META[s.subject]?.color || BRAND
            const active = s.id === selected
            return (
              <button key={s.id} onClick={() => setSelected(s.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all"
                style={active ? { background: c, color: 'white', borderColor: c } : { background: 'white', color: '#6b7280', borderColor: '#e5e7eb' }}>
                {s.name.split(' ')[0]}
              </button>
            )
          })}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          {/* Big stat card */}
          <div className="rounded-2xl p-5 text-white overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)` }}>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">{t.attendance_title}</p>
            <p className="text-5xl font-bold mt-1 leading-none">{attPct !== null ? `${attPct}%` : '—'}</p>
            <p className="text-white/60 text-xs mt-2">{child.attendance.present} {t.of_label} {child.attendance.total} {t.sessions_suffix}</p>
            <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white/80" style={{ width: `${attPct ?? 0}%` }} />
            </div>
          </div>
          {/* Status breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
            {(['present', 'absent', 'late', 'excused'] as const).map(status => {
              const count = child.attendance.recent.filter(r => r.status === status).length
              const s = statusCfg[status]
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dot }} />
                    <span className="text-sm text-gray-600">{s.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 tabular-nums">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="font-semibold text-gray-800">{t.session_history}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.most_recent} {child.attendance.recent.length} {t.sessions_suffix}</p>
          </div>
          {child.attendance.recent.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">{t.no_sessions}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {child.attendance.recent.map(rec => {
                const s = statusCfg[rec.status as keyof typeof statusCfg]
                  ?? { label: rec.status, color: '#6b7280', bg: '#f9fafb', dot: '#9ca3af' }
                return (
                  <div key={rec.id} className="flex items-start gap-4 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.bg }}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dot }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {rec.session?.session_date ?? '—'}
                        {rec.session?.session_time && <span className="text-gray-400 font-normal"> · {formatTime(rec.session.session_time)}</span>}
                      </p>
                      {rec.note && <p className="text-xs text-gray-400 italic mt-0.5">{rec.note}</p>}
                      {rec.session?.notes && (
                        <div className="mt-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-0.5">{t.teachers_note}</p>
                          <p className="text-xs text-amber-800">&ldquo;{rec.session.notes}&rdquo;</p>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-xl shrink-0" style={{ color: s.color, background: s.bg }}>
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
    <div className="space-y-5">
      <h2 className="text-base font-bold text-gray-900">{t.fees_title}</h2>
      <div className={`grid gap-4 ${students.length > 1 ? 'lg:grid-cols-2' : 'max-w-lg'}`}>
        {students.map(child => {
          const color = TIER_COLORS[child.tier] || SUBJECT_META[child.subject]?.color || BRAND
          const fee = feeCfg[child.fee_status as keyof typeof feeCfg ?? 'unpaid'] ?? feeCfg.unpaid
          const FeeIcon = fee.icon
          return (
            <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-2" style={{ background: color }} />
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar name={child.name} color={color} size={44} />
                  <div>
                    <h3 className="font-semibold text-gray-900">{child.name}</h3>
                    <p className="text-xs text-gray-400">{child.tier} · {child.branch}</p>
                  </div>
                </div>
                <div className="rounded-2xl p-4 border" style={{ background: fee.bg, borderColor: fee.border }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${fee.color}18` }}>
                      <FeeIcon className="w-5 h-5" style={{ color: fee.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: fee.color }}>{fee.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: `${fee.color}99` }}>{fee.sublabel}</p>
                    </div>
                    {child.fee_amount && (
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold" style={{ color: fee.color }}>
                          RM {parseFloat(child.fee_amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
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
                      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: fee.color }}>{t.note_from_hr}</p>
                      <p className="text-sm mt-1" style={{ color: `${fee.color}cc` }}>{child.fee_note}</p>
                    </div>
                  )}
                </div>
                {child.parent_contact && (
                  <a href={toWhatsApp(child.parent_contact, child.name, lang)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    style={{ background: '#25D366' }}>
                    <div className="flex items-center gap-2"><MessageCircle className="w-4 h-4" />{t.contact_via_whatsapp}</div>
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  </a>
                )}
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
  const displayName = parentEmail.split('@')[0].split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
  return (
    <div className="space-y-5 max-w-lg">
      <h2 className="text-base font-bold text-gray-900">{t.settings_title}</h2>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-lg" style={{ backgroundColor: BRAND }}>
            {displayName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-sm text-gray-400 truncate mt-0.5">{parentEmail}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {t.readonly_access}
            </span>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t.preferences}</p>
        </div>
        <button onClick={toggle} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center"><Globe className="w-4 h-4 text-gray-400" /></div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">{t.display_language}</p>
              <p className="text-xs text-gray-400">{lang === 'en' ? t.lang_english : t.lang_chinese}</p>
            </div>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600">{lang === 'en' ? '中文' : 'EN'}</span>
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t.about}</p>
        </div>
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center"><GraduationCap className="w-4 h-4 text-gray-400" /></div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Triple Tree Enrichment</p>
            <p className="text-xs text-gray-400">{t.portal_version}</p>
          </div>
        </div>
      </div>
      <button onClick={onSignOut} disabled={signingOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-100 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-60">
        {signingOut ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" /> : <LogOut className="w-4 h-4" />}
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

  const NAV = [
    { id: 'home',       Icon: LayoutDashboard },
    { id: 'schedule',   Icon: CalendarDays    },
    { id: 'progress',   Icon: TrendingUp      },
    { id: 'attendance', Icon: BookOpen        },
    { id: 'fees',       Icon: CreditCard      },
  ]

  async function signOut() {
    setSigningOut(true); startNavProgress()
    await supabase.auth.signOut(); router.push('/parent-login')
  }

  const firstName = parentEmail.split('@')[0].split('.')[0]
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="h-screen overflow-hidden flex" style={{ background: '#F0F2F5' }}>

      {/* ── Icon sidebar ─────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col items-center w-[72px] shrink-0 bg-white border-r border-gray-100 h-full py-5">
        {/* Logo mark */}
        <Image src="/logo.png" alt="Triple Tree" width={36} height={36} className="object-contain mb-8 shrink-0" />

        {/* Nav icons */}
        <div className="flex flex-col gap-1.5 flex-1">
          {NAV.map(({ id, Icon }) => {
            const isActive = activeTab === id
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                title={id.charAt(0).toUpperCase() + id.slice(1)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
                style={isActive
                  ? { background: '#111827', color: 'white' }
                  : { color: '#d1d5db' }}>
                <Icon className="w-[18px] h-[18px]" />
              </button>
            )
          })}
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col gap-1.5 mt-auto">
          <button onClick={() => setActiveTab('settings')} title="Settings"
            className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all"
            style={activeTab === 'settings' ? { background: '#111827', color: 'white' } : { color: '#d1d5db' }}>
            <Settings className="w-[18px] h-[18px]" />
          </button>
          <button onClick={signOut} disabled={signingOut} title="Sign out"
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-red-300 hover:bg-red-50 hover:text-red-400 transition-all disabled:opacity-60">
            {signingOut
              ? <span className="w-4 h-4 border-2 border-red-200 border-t-red-400 rounded-full animate-spin" />
              : <LogOut className="w-[18px] h-[18px]" />}
          </button>
        </div>
      </aside>

      {/* ── Center + Right ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-w-0">

        {/* Center column */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Sticky greeting header */}
          <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100 px-5 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile logo */}
                <Image src="/logo.png" alt="" width={28} height={28} className="lg:hidden object-contain shrink-0" />
                <div>
                  <h1 className="text-base font-bold text-gray-900">
                    {greeting}, {displayName}! 👋
                  </h1>
                  <p className="text-xs text-gray-400 hidden sm:block">
                    {students.length === 1
                      ? `Viewing ${students[0].name}'s progress`
                      : `${students.length} children at Triple Tree`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center relative">
                  <Bell className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => setActiveTab('settings')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: BRAND }}>
                  {displayName[0]}
                </button>
              </div>
            </div>
          </header>

          {/* Tab content */}
          <main className="flex-1 overflow-y-auto p-5 lg:p-8">
            {activeTab === 'home'       && <HomeTab students={students} onTab={setActiveTab} t={t} />}
            {activeTab === 'schedule'   && <ScheduleTab students={students} t={t} lang={lang} />}
            {activeTab === 'progress'   && <ProgressTab students={students} t={t} lang={lang} />}
            {activeTab === 'attendance' && <AttendanceTab students={students} t={t} />}
            {activeTab === 'fees'       && <FeesTab students={students} t={t} lang={lang} />}
            {activeTab === 'settings'   && (
              <SettingsTab parentEmail={parentEmail} lang={lang} toggle={toggle}
                onSignOut={signOut} signingOut={signingOut} t={t} />
            )}
          </main>
        </div>

        {/* ── Right panel ─────────────────────────────────────────────────────── */}
        <RightPanel students={students} activeTab={activeTab} t={t} lang={lang} />
      </div>

      {/* ── Mobile bottom nav ────────────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100">
        <div className="flex items-center justify-around px-2 pt-2 pb-3">
          {[...NAV, { id: 'settings', Icon: Settings }].map(({ id, Icon }) => {
            const isActive = activeTab === id
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl min-w-[44px] transition-all"
                style={isActive ? { color: BRAND } : { color: '#9ca3af' }}>
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-semibold capitalize">{id}</span>
              </button>
            )
          })}
        </div>
      </nav>

      <div className="lg:hidden h-20" />
    </div>
  )
}
