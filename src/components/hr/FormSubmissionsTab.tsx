'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ChevronDown, ChevronUp, UserPlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Teacher } from '@/types'
import { SUBJECT_META } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

type Submission = {
  id: string
  created_at: string
  date: string | null
  student_name: string
  student_age: number | null
  student_dob: string | null
  age_group: string | null
  school_grade: string | null
  parent_name: string | null
  contact: string | null
  email: string | null
  dominant_language: string | null
  dominant_language_other: string | null
  interested_subjects: string[]
  interested_skills: string[]
  level_mandarin: string | null
  level_english: string | null
  level_maths: string | null
  level_coding: string | null
  focus_area: string | null
  consultant_name: string | null
  status: 'new' | 'converted' | 'dismissed'
}

const SUBJECT_MAP: Record<string, string> = {
  english: 'English', maths_e: 'Maths (E)', maths_m: 'Maths (M)',
  coding: 'Coding', mandarin: 'Mandarin', science: 'Science',
}
const SKILL_MAP: Record<string, string> = {
  english_reading:   'English Reading',  english_speaking:  'English Speaking',
  mandarin_reading:  'Mandarin Reading', mandarin_speaking: 'Mandarin Speaking',
  creative_art:      'Creative Art',     calligraphy:       'Calligraphy',
}
const LEVEL_MAP: Record<string, { en: string; zh: string }> = {
  understand_cant_speak:  { en: "Understand, Can't Speak",        zh: '明白但不会讲' },
  can_speak_simple:       { en: "Can Speak, Can't Read & Write",   zh: '会讲不会写和读' },
  can_speak_write_basic:  { en: 'Can Speak, Write & Read (Basic)', zh: '会说读写基础' },
  zero_basic:             { en: 'Zero Basic',                      zh: '完全不会' },
  strong:                 { en: 'Strong',                          zh: '强' },
  moderate:               { en: 'Moderate',                        zh: '中等' },
  weak:                   { en: 'Weak',                            zh: '弱' },
}

const TO_SUBJECT: Record<string, string> = {
  english: 'english', maths_e: 'maths', maths_m: 'maths',
  coding: 'coding', mandarin: 'chinese', science: 'coding',
}

const LEVEL_STYLE: Record<string, { bg: string; text: string }> = {
  strong:                { bg: '#EAFAF1', text: '#1E8449' },
  moderate:              { bg: '#FEF9E7', text: '#B7770D' },
  weak:                  { bg: '#FDEDEC', text: '#922B21' },
  zero_basic:            { bg: '#F2F3F4', text: '#6B7280' },
  understand_cant_speak: { bg: '#EBF5FB', text: '#1A5276' },
  can_speak_simple:      { bg: '#EBF5FB', text: '#1A5276' },
  can_speak_write_basic: { bg: '#EAFAF1', text: '#1E8449' },
}

function LevelPill({ value }: { value: string }) {
  const entry = LEVEL_MAP[value]
  const style = LEVEL_STYLE[value] ?? { bg: '#F2F3F4', text: '#6B7280' }
  if (!entry) return <span className="text-xs text-gray-500">{value}</span>
  return (
    <span
      className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: style.bg, color: style.text }}
    >
      {entry.en}
    </span>
  )
}

function StatusBadge({ status }: { status: Submission['status'] }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]
  const map = {
    new:       { label: t.hr_submissions.filter_new,       cls: 'bg-blue-50 text-blue-600' },
    converted: { label: t.hr_submissions.filter_converted, cls: 'bg-green-50 text-green-700' },
    dismissed: { label: t.hr_submissions.filter_dismissed, cls: 'bg-gray-100 text-gray-500' },
  }
  const { label, cls } = map[status]
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
}

function ConvertDialog({ sub, teachers, onClose, onDone }: {
  sub: Submission; teachers: Teacher[]; onClose: () => void; onDone: () => void
}) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const relevantSubjects = Array.from(new Set(
    sub.interested_subjects.map(s => TO_SUBJECT[s]).filter(Boolean)
  )) as string[]
  const subjectOptions = relevantSubjects.length > 0 ? relevantSubjects : ['coding', 'english', 'maths', 'chinese']

  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? '')
  const [subject, setSubject] = useState(subjectOptions[0] ?? 'coding')
  const [trialDate, setTrialDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState(sub.focus_area ?? '')
  const [saving, setSaving] = useState(false)

  async function confirm() {
    if (!teacherId || !subject || !trialDate) { toast.error('请填写所有字段 / Fill all fields'); return }
    setSaving(true)
    const res = await fetch('/api/convert-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: sub.id, teacher_id: teacherId, subject, trial_date: trialDate, notes }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(json.error ?? '转换失败 / Failed to convert'); return }
    toast.success(`${sub.student_name} 已添加为试课学生 / added as a trial student`)
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">{t.hr_submissions.convert_title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{sub.student_name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Pre-filled info */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs text-gray-600">
            {sub.student_age && <p><span className="font-semibold">{t.hr_submissions.col_age}:</span> {sub.student_age}</p>}
            {sub.age_group && <p><span className="font-semibold">{t.hr_submissions.age_group_label}:</span> {sub.age_group}</p>}
            {sub.parent_name && <p><span className="font-semibold">{t.hr_submissions.detail_parent}:</span> {sub.parent_name}</p>}
            {sub.contact && <p><span className="font-semibold">{t.hr_submissions.col_contact}:</span> {sub.contact}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">{t.hr_submissions.assign_teacher}</label>
            <select value={teacherId} onChange={e => setTeacherId(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400">
              {teachers.filter(teacher => teacher.active !== false).map(teacher => (
                <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">{t.hr_submissions.subject}</label>
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400">
              {subjectOptions.map(s => (
                <option key={s} value={s}>{SUBJECT_META[s as keyof typeof SUBJECT_META]?.label ?? s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">{t.hr_submissions.trial_date}</label>
            <input type="date" value={trialDate} onChange={e => setTrialDate(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">{t.hr_submissions.notes_optional}</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={t.hr_submissions.notes_placeholder}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400 resize-none" />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button onClick={confirm} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: '#1E8449' }}>
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            {t.hr_submissions.confirm}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            {t.hr_submissions.cancel}
          </button>
        </div>
      </div>
    </div>
  )
}

function SubmissionRow({ sub, teachers, onRefresh }: {
  sub: Submission; teachers: Teacher[]; onRefresh: () => void
}) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [expanded, setExpanded] = useState(false)
  const [converting, setConverting] = useState(false)
  const [dismissing, setDismissing] = useState(false)
  const supabase = createClient()

  async function dismiss() {
    setDismissing(true)
    await supabase.from('form_submissions').update({ status: 'dismissed' }).eq('id', sub.id)
    setDismissing(false)
    onRefresh()
  }

  return (
    <>
      {converting && (
        <ConvertDialog sub={sub} teachers={teachers}
          onClose={() => setConverting(false)}
          onDone={() => { setConverting(false); onRefresh() }} />
      )}
      <tr className="hover:bg-gray-50 transition-colors">
        <td className="px-5 py-3.5">
          <p className="font-semibold text-gray-900 text-sm">{sub.student_name}</p>
          {sub.consultant_name && (
            <p className="text-xs text-gray-400">via {sub.consultant_name}</p>
          )}
        </td>
        <td className="px-4 py-3.5 text-xs text-gray-500">
          {sub.student_age ? `${sub.student_age} yrs` : '—'}
          {sub.age_group && <span className="ml-1 text-gray-400">({sub.age_group})</span>}
        </td>
        <td className="px-4 py-3.5 text-xs text-gray-600">
          <p>{sub.contact ?? '—'}</p>
          {sub.email && <p className="text-gray-400">{sub.email}</p>}
        </td>
        <td className="px-4 py-3.5">
          <div className="flex flex-wrap gap-1">
            {(sub.interested_subjects ?? []).map(s => (
              <span key={s} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {SUBJECT_MAP[s] ?? s}
              </span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3.5 text-xs text-gray-400">
          {new Date(sub.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
        </td>
        <td className="px-4 py-3.5"><StatusBadge status={sub.status} /></td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1.5 justify-end">
            <button onClick={() => setExpanded(e => !e)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {sub.status === 'new' && (
              <>
                <button onClick={() => setConverting(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: '#1E8449' }}>
                  <UserPlus className="w-3 h-3" /> {t.hr_submissions.convert}
                </button>
                <button onClick={dismiss} disabled={dismissing}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                  {dismissing ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                  {t.hr_submissions.dismiss}
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={7} className="px-4 pt-0 pb-4 bg-white">
            <div className="rounded-xl border border-gray-100 bg-gray-50 overflow-hidden">
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">

                {/* Left — contact & personal */}
                <div className="p-4 space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {t.hr_submissions.detail_parent} &amp; Contact
                  </p>
                  <div className="space-y-2">
                    {sub.parent_name && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 w-16 shrink-0">
                          {t.hr_submissions.detail_parent}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">{sub.parent_name}</span>
                      </div>
                    )}
                    {sub.contact && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 w-16 shrink-0">
                          {t.hr_submissions.col_contact}
                        </span>
                        <a href={`tel:${sub.contact}`} className="text-sm text-[#1A5276] font-medium hover:underline">
                          {sub.contact}
                        </a>
                      </div>
                    )}
                    {sub.email && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 w-16 shrink-0">Email</span>
                        <a href={`mailto:${sub.email}`} className="text-sm text-[#1A5276] font-medium hover:underline truncate">
                          {sub.email}
                        </a>
                      </div>
                    )}
                    {sub.school_grade && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 w-16 shrink-0">
                          {t.hr_submissions.detail_school_grade}
                        </span>
                        <span className="text-sm text-gray-700">{sub.school_grade}</span>
                      </div>
                    )}
                    {sub.dominant_language && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-semibold text-gray-400 w-16 shrink-0">
                          {t.hr_submissions.detail_language}
                        </span>
                        <span className="text-sm text-gray-700 capitalize">
                          {sub.dominant_language}
                          {sub.dominant_language_other ? ` (${sub.dominant_language_other})` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right — academic levels + skills */}
                <div className="p-4 space-y-4">
                  {/* Academic levels */}
                  {(sub.level_mandarin || sub.level_english || sub.level_maths || sub.level_coding) && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Academic Level</p>
                      <div className="space-y-1.5">
                        {([
                          ['Mandarin', sub.level_mandarin],
                          ['English',  sub.level_english],
                          ['Maths',    sub.level_maths],
                          ['Coding',   sub.level_coding],
                        ] as [string, string | null][]).filter(([, v]) => v).map(([label, value]) => (
                          <div key={label} className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-gray-500 w-14 shrink-0">{label}</span>
                            <LevelPill value={value!} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skills */}
                  {sub.interested_skills?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {t.hr_submissions.detail_skills}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {sub.interested_skills.map(s => (
                          <span key={s} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white border border-gray-200 text-gray-600">
                            {SKILL_MAP[s] ?? s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Focus area — full width at bottom */}
              {sub.focus_area && (
                <div className="px-4 py-3 border-t border-gray-100 bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    {t.hr_submissions.detail_focus}
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{sub.focus_area}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function FormSubmissionsTab({ teachers }: { teachers: Teacher[] }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'converted' | 'dismissed'>('all')
  const router = useRouter()
  const supabase = createClient()

  async function load() {
    const { data } = await supabase
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false })
    setSubmissions((data ?? []) as Submission[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = submissions.filter(s => statusFilter === 'all' || s.status === statusFilter)
  const newCount = submissions.filter(s => s.status === 'new').length

  const FILTER_LABELS: Record<string, string> = {
    all: t.hr_submissions.filter_all,
    new: t.hr_submissions.filter_new,
    converted: t.hr_submissions.filter_converted,
    dismissed: t.hr_submissions.filter_dismissed,
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-gray-400">{t.hr_submissions.loading}</div>
  }

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'new', 'converted', 'dismissed'] as const).map(s => {
          const count = s === 'all' ? submissions.length : s === 'new' ? newCount : null
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === s ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {FILTER_LABELS[s]}{count !== null && ` (${count})`}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center space-y-1">
          <p className="text-sm text-gray-400">{t.hr_submissions.no_submissions}</p>
          <p className="text-xs text-gray-300">{t.hr_submissions.share_hint} <code className="bg-gray-100 px-1 rounded">/form</code> {t.hr_submissions.with_families}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{t.hr_submissions.col_student}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t.hr_submissions.col_age}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t.hr_submissions.col_contact}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t.hr_submissions.col_subjects}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t.hr_submissions.col_submitted}</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t.hr_submissions.col_status}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(sub => (
                  <SubmissionRow key={sub.id} sub={sub} teachers={teachers}
                    onRefresh={() => { load(); router.refresh() }} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
