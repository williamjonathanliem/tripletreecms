'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, CheckCircle2 } from 'lucide-react'

type Lang = 'en' | 'zh'

type FormData = {
  date: string; student_name: string; student_age: string; student_dob: string
  school_grade: string; parent_name: string; contact: string; email: string
  dominant_language: string; dominant_language_other: string
  interested_subjects: string[]; interested_skills: string[]
  level_mandarin: string; level_english: string; level_maths: string; level_coding: string
  focus_area: string; consultant_name: string
}

const EMPTY: FormData = {
  date: '', student_name: '', student_age: '', student_dob: '', school_grade: '',
  parent_name: '', contact: '', email: '', dominant_language: '', dominant_language_other: '',
  interested_subjects: [], interested_skills: [],
  level_mandarin: '', level_english: '', level_maths: '', level_coding: '',
  focus_area: '', consultant_name: '',
}

const T = {
  en: {
    subtitle: 'Student Registration',
    s_student: 'Student Information', s_parent: 'Parent / Guardian',
    s_subjects: 'Interested Subjects', s_skills: 'Skills & Enrichment',
    s_levels: 'Current Level', s_additional: 'Additional Information',
    name: 'Student Name', age: 'Age', date: 'Date', dob: 'Date of Birth', school: 'School / Grade',
    parent_name: 'Parent Name', contact: 'Contact Number', email: 'Email Address',
    dominant_language: 'Dominant Language',
    lang_en: 'English', lang_mandarin: 'Mandarin', lang_others: 'Others',
    specify: 'Please specify',
    mandarin_level: 'Mandarin', english_level: 'English',
    maths_level: 'Maths', coding_level: 'Coding & Robotics',
    focus_area: 'Goals & Focus Area', consultant: 'Consultant Name',
    ph_name: 'Full name', ph_age: '10', ph_school: 'e.g. SK Taman Jaya, Year 4',
    ph_parent: 'Parent / guardian name', ph_contact: '+60 12-345 6789',
    ph_email: 'example@email.com', ph_specify: 'e.g. Thai, Japanese…',
    ph_focus: 'Goals, concerns, or specific areas to work on…',
    ph_consultant: 'Name of consultant who assisted you',
    submit: 'Submit Registration',
    privacy: 'By submitting, you consent to being contacted by Triple Tree Enrichment Centre.',
    err_name: 'Student name is required.', err_contact: 'Please provide a contact number or email.',
    err_failed: 'Submission failed. Please try again.',
    success_title: 'Registration Received',
    success_msg: 'Thank you for registering. Our team will be in touch shortly to confirm your session.',
    lv_understand: 'Understand, cannot speak',
    lv_speak_simple: 'Can speak, cannot read or write',
    lv_speak_basic: 'Can speak, read and write (basic)',
    lv_zero: 'No prior experience',
    lv_strong: 'Strong', lv_moderate: 'Moderate', lv_weak: 'Weak',
  },
  zh: {
    subtitle: '学生注册',
    s_student: '学生资料', s_parent: '家长联系资料',
    s_subjects: '关注课目', s_skills: '关注技能',
    s_levels: '学生程度', s_additional: '其他资料',
    name: '学生名字', age: '岁数', date: '日期', dob: '生日日期', school: '学校/班级',
    parent_name: '家长名字', contact: '联系号码', email: '电邮',
    dominant_language: '主要语言',
    lang_en: '英文', lang_mandarin: '中文', lang_others: '其它',
    specify: '请注明',
    mandarin_level: '中文程度', english_level: '英文程度',
    maths_level: '数学', coding_level: '编程',
    focus_area: '学生关注点', consultant: '顾问名字',
    ph_name: '全名', ph_age: '10', ph_school: '例如 SK Taman Jaya，四年级',
    ph_parent: '家长/监护人姓名', ph_contact: '+60 12-345 6789',
    ph_email: 'example@email.com', ph_specify: '例如 泰文、日文…',
    ph_focus: '任何具体目标、关注点或需重点关注的领域…',
    ph_consultant: '协助您的顾问姓名',
    submit: '提交注册',
    privacy: '提交此表格即表示您同意接受 Triple Tree 丰富中心的联系。',
    err_name: '请填写学生姓名。', err_contact: '请提供联系电话或电子邮件。',
    err_failed: '提交失败，请重试。',
    success_title: '注册成功',
    success_msg: '感谢您的注册。我们的顾问将尽快联系您确认课程时间。',
    lv_understand: '明白但不会讲',
    lv_speak_simple: '会讲，不会写和读',
    lv_speak_basic: '会说读写（基础）',
    lv_zero: '完全不会',
    lv_strong: '强', lv_moderate: '中等', lv_weak: '弱',
  },
} as const

const SUBJECTS = [
  { value: 'english',        en: 'English',           zh: '英文' },
  { value: 'maths_e',        en: 'Maths (English)',   zh: '英数' },
  { value: 'maths_m',        en: 'Maths (Mandarin)',  zh: '华数' },
  { value: 'coding',         en: 'Coding & Robotics', zh: '编程机器人' },
  { value: 'mandarin',       en: 'Mandarin',          zh: '华文' },
  { value: 'mandarin_extra', en: 'Mandarin (Extra)',  zh: '华文加强' },
  { value: 'science',        en: 'Science',           zh: '科学' },
]

const SKILLS = [
  { value: 'english_reading',   en: 'English Reading',   zh: '英文阅读' },
  { value: 'english_speaking',  en: 'English Speaking',  zh: '英文演讲' },
  { value: 'mandarin_reading',  en: 'Mandarin Reading',  zh: '华文阅读' },
  { value: 'mandarin_speaking', en: 'Mandarin Speaking', zh: '华文演讲' },
  { value: 'creative_art',      en: 'Creative Art',      zh: '创意绘画' },
  { value: 'calligraphy',       en: 'Calligraphy',       zh: '书法' },
]

type Translations = typeof T['en'] | typeof T['zh']

const LANG_LEVELS = (t: Translations) => [
  { value: 'understand_cant_speak', label: t.lv_understand },
  { value: 'can_speak_simple',      label: t.lv_speak_simple },
  { value: 'can_speak_write_basic', label: t.lv_speak_basic },
  { value: 'zero_basic',            label: t.lv_zero },
]

const PROFICIENCY = (t: Translations) => [
  { value: 'strong',     label: t.lv_strong },
  { value: 'moderate',   label: t.lv_moderate },
  { value: 'weak',       label: t.lv_weak },
  { value: 'zero_basic', label: t.lv_zero },
]

// ── DateInput ─────────────────────────────────────────────────────────────────

const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_ZH = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

function DateInput({ value, onChange, lang, yearRange }: {
  value: string
  onChange: (v: string) => void
  lang: Lang
  yearRange?: [number, number]
}) {
  const parts = value ? value.split('-') : ['', '', '']
  const [y, m, d] = parts

  const months = lang === 'zh' ? MONTHS_ZH : MONTHS_EN
  const now     = new Date().getFullYear()
  const [minY, maxY] = yearRange ?? [now - 20, now + 1]
  const years = Array.from({ length: maxY - minY + 1 }, (_, i) => maxY - i)
  const daysInMonth = m && y ? new Date(Number(y), Number(m), 0).getDate() : 31
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  function emit(ny: string, nm: string, nd: string) {
    if (ny && nm && nd) onChange(`${ny}-${nm.padStart(2,'0')}-${nd.padStart(2,'0')}`)
    else onChange('')
  }

  const sel = `flex-1 h-11 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all appearance-none cursor-pointer`

  return (
    <div className="flex gap-2">
      {/* Day */}
      <select value={d} onChange={e => emit(y, m, e.target.value)} className={sel} style={{ minWidth: 0 }}>
        <option value="">{lang === 'zh' ? '日' : 'Day'}</option>
        {days.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
      {/* Month */}
      <select value={m} onChange={e => emit(y, e.target.value, d)} className={sel} style={{ minWidth: 0, flex: 1.4 }}>
        <option value="">{lang === 'zh' ? '月' : 'Month'}</option>
        {months.map((label, i) => <option key={i+1} value={i+1}>{label}</option>)}
      </select>
      {/* Year */}
      <select value={y} onChange={e => emit(e.target.value, m, d)} className={sel} style={{ minWidth: 0, flex: 1.2 }}>
        <option value="">{lang === 'zh' ? '年' : 'Year'}</option>
        {years.map(n => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  )
}

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionDivider({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span className="text-xs font-black tracking-widest text-gray-300 tabular-nums select-none">{n}</span>
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 mb-2 tracking-wide">
      {children}
      {required && <span className="text-rose-400 ml-0.5">*</span>}
    </label>
  )
}

const field = "w-full h-11 px-3.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"

function RadioRow({ value, label, checked, onChange, color }: {
  value: string; label: string; checked: boolean
  onChange: () => void; color?: string
}) {
  return (
    <label
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg border cursor-pointer transition-all select-none"
      style={checked
        ? { borderColor: color ?? '#111827', background: color ? `${color}08` : '#f9fafb' }
        : { borderColor: '#e5e7eb', background: 'white' }
      }
    >
      <input type="radio" value={value} checked={checked} onChange={onChange} className="sr-only" />
      <div
        className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
        style={{ borderColor: checked ? (color ?? '#111827') : '#d1d5db' }}
      >
        {checked && (
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: color ?? '#111827' }} />
        )}
      </div>
      <span className="text-sm" style={{ color: checked ? (color ?? '#111827') : '#374151' }}>{label}</span>
    </label>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FormPage() {
  const [lang, setLang]             = useState<Lang>('en')
  const [data, setData]             = useState<FormData>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('form_lang') as Lang | null
    if (saved === 'en' || saved === 'zh') setLang(saved)
  }, [])

  const t = T[lang]
  function switchLang(l: Lang) { setLang(l); localStorage.setItem('form_lang', l) }
  function set(k: keyof FormData, v: string) { setData(p => ({ ...p, [k]: v })) }
  function toggle(k: 'interested_subjects' | 'interested_skills', v: string) {
    setData(p => ({
      ...p, [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v],
    }))
  }

  const isValid = useMemo(() =>
    data.student_name.trim().length > 0 && (data.contact.trim().length > 0 || data.email.trim().length > 0)
  , [data.student_name, data.contact, data.email])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!data.student_name.trim()) { toast.error(t.err_name); return }
    if (!data.contact.trim() && !data.email.trim()) { toast.error(t.err_contact); return }
    setSubmitting(true)
    const { error } = await supabase.from('form_submissions').insert({
      date:                    data.date || new Date().toISOString().split('T')[0],
      student_name:            data.student_name.trim(),
      student_age:             data.student_age ? parseInt(data.student_age) : null,
      student_dob:             data.student_dob || null,
      school_grade:            data.school_grade || null,
      parent_name:             data.parent_name || null,
      contact:                 data.contact || null,
      email:                   data.email || null,
      dominant_language:       data.dominant_language || null,
      dominant_language_other: data.dominant_language_other || null,
      interested_subjects:     data.interested_subjects,
      interested_skills:       data.interested_skills,
      level_mandarin:          data.level_mandarin || null,
      level_english:           data.level_english || null,
      level_maths:             data.level_maths || null,
      level_coding:            data.level_coding || null,
      focus_area:              data.focus_area || null,
      consultant_name:         data.consultant_name || null,
    })
    setSubmitting(false)
    if (error) { toast.error(t.err_failed); return }
    setSubmitted(true)
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t.success_title}</h1>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{t.success_msg}</p>
        <div className="mt-10 flex items-center gap-2 opacity-30">
          <Image src="/logo.png" alt="Triple Tree" width={18} height={18} className="object-contain" />
          <span className="text-xs text-gray-600 font-medium">Triple Tree Enrichment Centre</span>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Triple Tree" width={28} height={28} className="object-contain" />
          <div>
            <p className="text-sm font-bold text-gray-900 leading-none">Triple Tree</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Enrichment Centre</p>
          </div>
        </div>
        <div className="flex items-center bg-gray-100 rounded-md p-0.5 gap-0.5">
          {(['en', 'zh'] as const).map(l => (
            <button key={l} onClick={() => switchLang(l)}
              className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
              style={lang === l
                ? { background: 'white', color: '#111827', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }
                : { color: '#9ca3af' }
              }>
              {l === 'en' ? 'EN' : '中文'}
            </button>
          ))}
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-2xl mx-auto px-5 pt-10 pb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
          Triple Tree Enrichment Centre
        </p>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{t.subtitle}</h1>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          {lang === 'en'
            ? 'Complete the form below and our team will be in touch to arrange your trial session.'
            : '请填写以下表格，我们的顾问将尽快联系您安排试课。'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-5 pb-20 space-y-14">

        {/* 01 — Student */}
        <section>
          <SectionDivider n="01" label={t.s_student} />
          <div className="space-y-5">
            <div>
              <Label required>{t.name}</Label>
              <input className={field} placeholder={t.ph_name}
                value={data.student_name} onChange={e => set('student_name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t.age}</Label>
                <input type="number" min={1} max={99} className={field} placeholder={t.ph_age}
                  value={data.student_age} onChange={e => set('student_age', e.target.value)} />
              </div>
              <div>
                <Label>{t.date}</Label>
                <DateInput lang={lang} value={data.date} onChange={v => set('date', v)}
                  yearRange={[new Date().getFullYear() - 1, new Date().getFullYear() + 1]} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t.dob}</Label>
                <DateInput lang={lang} value={data.student_dob} onChange={v => set('student_dob', v)}
                  yearRange={[new Date().getFullYear() - 25, new Date().getFullYear()]} />
              </div>
              <div>
                <Label>{t.school}</Label>
                <input className={field} placeholder={t.ph_school}
                  value={data.school_grade} onChange={e => set('school_grade', e.target.value)} />
              </div>
            </div>
          </div>
        </section>

        {/* 02 — Parent */}
        <section>
          <SectionDivider n="02" label={t.s_parent} />
          <div className="space-y-5">
            <div>
              <Label>{t.parent_name}</Label>
              <input className={field} placeholder={t.ph_parent}
                value={data.parent_name} onChange={e => set('parent_name', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>{t.contact} <span className="normal-case font-normal text-gray-400 tracking-normal"></span></Label>
                <input type="tel" className={field} placeholder={t.ph_contact}
                  value={data.contact} onChange={e => set('contact', e.target.value)} />
              </div>
              <div>
                <Label required>{t.email} <span className="normal-case font-normal text-gray-400 tracking-normal"></span></Label>
                <input type="email" className={field} placeholder={t.ph_email}
                  value={data.email} onChange={e => set('email', e.target.value)} />
              </div>
            </div>
            <div>
              <Label>{t.dominant_language}</Label>
              <div className="flex gap-2">
                {[
                  { value: 'english',  label: t.lang_en },
                  { value: 'mandarin', label: t.lang_mandarin },
                  { value: 'others',   label: t.lang_others },
                ].map(l => {
                  const sel = data.dominant_language === l.value
                  return (
                    <button key={l.value} type="button" onClick={() => set('dominant_language', sel ? '' : l.value)}
                      className="flex-1 h-11 rounded-lg border text-sm font-medium transition-all"
                      style={sel
                        ? { background: '#111827', color: 'white', borderColor: '#111827' }
                        : { background: 'white', color: '#6b7280', borderColor: '#e5e7eb' }
                      }>
                      {l.label}
                    </button>
                  )
                })}
              </div>
              {data.dominant_language === 'others' && (
                <input className={`${field} mt-2`} placeholder={t.ph_specify}
                  value={data.dominant_language_other} onChange={e => set('dominant_language_other', e.target.value)} />
              )}
            </div>
          </div>
        </section>

        {/* 03 — Subjects */}
        <section>
          <SectionDivider n="03" label={t.s_subjects} />
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map(s => {
              const sel = data.interested_subjects.includes(s.value)
              return (
                <button key={s.value} type="button" onClick={() => toggle('interested_subjects', s.value)}
                  className="h-10 px-4 rounded-lg border text-sm font-medium transition-all"
                  style={sel
                    ? { background: '#111827', color: 'white', borderColor: '#111827' }
                    : { background: 'white', color: '#6b7280', borderColor: '#e5e7eb' }
                  }>
                  {lang === 'en' ? s.en : s.zh}
                </button>
              )
            })}
          </div>
        </section>

        {/* 04 — Skills */}
        <section>
          <SectionDivider n="04" label={t.s_skills} />
          <div className="flex flex-wrap gap-2">
            {SKILLS.map(s => {
              const sel = data.interested_skills.includes(s.value)
              return (
                <button key={s.value} type="button" onClick={() => toggle('interested_skills', s.value)}
                  className="h-10 px-4 rounded-lg border text-sm font-medium transition-all"
                  style={sel
                    ? { background: '#111827', color: 'white', borderColor: '#111827' }
                    : { background: 'white', color: '#6b7280', borderColor: '#e5e7eb' }
                  }>
                  {lang === 'en' ? s.en : s.zh}
                </button>
              )
            })}
          </div>
        </section>

        {/* 05 — Levels */}
        <section>
          <SectionDivider n="05" label={t.s_levels} />
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Mandarin */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3 tracking-wide">{t.mandarin_level}</p>
                <div className="space-y-2">
                  {LANG_LEVELS(t).map(o => (
                    <RadioRow key={o.value} value={o.value} label={o.label}
                      checked={data.level_mandarin === o.value}
                      onChange={() => set('level_mandarin', o.value)}
                      color="#C0392B" />
                  ))}
                </div>
              </div>
              {/* English */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3 tracking-wide">{t.english_level}</p>
                <div className="space-y-2">
                  {LANG_LEVELS(t).map(o => (
                    <RadioRow key={o.value} value={o.value} label={o.label}
                      checked={data.level_english === o.value}
                      onChange={() => set('level_english', o.value)}
                      color="#1A5276" />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              {/* Maths */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3 tracking-wide">{t.maths_level}</p>
                <div className="space-y-2">
                  {PROFICIENCY(t).map(o => (
                    <RadioRow key={o.value} value={o.value} label={o.label}
                      checked={data.level_maths === o.value}
                      onChange={() => set('level_maths', o.value)}
                      color="#1E8449" />
                  ))}
                </div>
              </div>
              {/* Coding */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3 tracking-wide">{t.coding_level}</p>
                <div className="space-y-2">
                  {PROFICIENCY(t).map(o => (
                    <RadioRow key={o.value} value={o.value} label={o.label}
                      checked={data.level_coding === o.value}
                      onChange={() => set('level_coding', o.value)}
                      color="#1A5276" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 06 — Additional */}
        <section>
          <SectionDivider n="06" label={t.s_additional} />
          <div className="space-y-5">
            <div>
              <Label>{t.focus_area}</Label>
              <textarea rows={4} className={`${field} h-auto py-3 resize-none`}
                placeholder={t.ph_focus}
                value={data.focus_area} onChange={e => set('focus_area', e.target.value)} />
            </div>
            <div>
              <Label>{t.consultant}</Label>
              <input className={field} placeholder={t.ph_consultant}
                value={data.consultant_name} onChange={e => set('consultant_name', e.target.value)} />
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="pt-2 border-t border-gray-100 space-y-4">
          <p className="text-xs text-gray-400 leading-relaxed">{t.privacy}</p>
          <button
            type="submit"
            disabled={submitting || !isValid}
            className="w-full h-13 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={isValid
              ? { background: '#111827', color: 'white', cursor: 'pointer' }
              : { background: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }
            }
          >
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" />{lang === 'en' ? 'Submitting…' : '提交中…'}</>
              : t.submit
            }
          </button>
        </div>

      </form>
    </div>
  )
}
