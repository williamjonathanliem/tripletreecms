'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Lang = 'en' | 'zh'

type Translation = {
  subtitle: string
  section_student: string; section_parent: string; section_subjects: string
  section_skills: string; section_levels: string; section_additional: string
  date: string; age: string; name: string; dob: string; school: string
  parent_name: string; contact: string; email: string
  dominant_language: string; specify: string
  focus_area: string; consultant: string
  mandarin_level: string; english_level: string; maths_level: string; coding_level: string
  lang_en: string; lang_mandarin: string; lang_others: string
  ph_name: string; ph_age: string; ph_school: string; ph_parent: string
  ph_contact: string; ph_email: string; ph_specify: string; ph_focus: string; ph_consultant: string
  submit: string; submitting: string; privacy: string
  err_name: string; err_contact: string; err_failed: string
  success_title: string; success_msg: string
  level_understand: string; level_speak_simple: string; level_speak_basic: string; level_zero: string
  level_strong: string; level_moderate: string; level_weak: string
}

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
    section_student: 'Student Information',
    section_parent: 'Parent / Guardian',
    section_subjects: 'Interested Subjects',
    section_skills: 'Skills & Enrichment',
    section_levels: 'Current Level',
    section_additional: 'Additional Information',
    date: 'Date', age: 'Age', name: 'Student Name', dob: 'Date of Birth', school: 'School / Grade',
    parent_name: 'Parent Name', contact: 'Contact Number', email: 'Email',
    dominant_language: 'Dominant Language', specify: 'Please specify',
    focus_area: 'Goals & Focus Area', consultant: 'Consultant Name',
    mandarin_level: 'Mandarin Level', english_level: 'English Level',
    maths_level: 'Maths', coding_level: 'Coding',
    lang_en: 'English', lang_mandarin: 'Mandarin', lang_others: 'Others',
    ph_name: 'Full name', ph_age: 'e.g. 10', ph_school: 'e.g. SK Taman Jaya, Year 4',
    ph_parent: 'Parent / guardian name', ph_contact: '+60 12-345 6789',
    ph_email: 'example@email.com', ph_specify: 'Please specify',
    ph_focus: 'Specific goals, concerns, or areas to focus on…',
    ph_consultant: 'Name of consultant who assisted you',
    submit: 'Submit Registration', submitting: 'Submitting…',
    privacy: 'By submitting this form, you consent to being contacted by Triple Tree Enrichment Centre.',
    err_name: 'Student name is required.',
    err_contact: 'Please provide a contact number or email.',
    err_failed: 'Submission failed. Please try again.',
    success_title: 'Registration Received',
    success_msg: 'Thank you for registering with Triple Tree Enrichment Centre. Our consultant will be in touch shortly to confirm your session.',
    level_understand: "Understand, cannot speak",
    level_speak_simple: "Can speak, cannot read or write",
    level_speak_basic: 'Can speak, read and write (basic)',
    level_zero: 'No prior experience',
    level_strong: 'Strong', level_moderate: 'Moderate', level_weak: 'Weak',
  },
  zh: {
    subtitle: '学生注册',
    section_student: '学生资料', section_parent: '家长联系资料',
    section_subjects: '关注课目', section_skills: '关注技能',
    section_levels: '学生程度', section_additional: '其他资料',
    date: '日期', age: '岁数', name: '学生名字', dob: '生日日期', school: '学校/班级',
    parent_name: '家长名字', contact: '联系号码', email: '电邮',
    dominant_language: '主要语言', specify: '请注明',
    focus_area: '学生关注点', consultant: '顾问名字',
    mandarin_level: '中文程度', english_level: '英文程度',
    maths_level: '数学程度', coding_level: '编程程度',
    lang_en: '英文', lang_mandarin: '中文', lang_others: '其它',
    ph_name: '全名', ph_age: '例如 10', ph_school: '例如 SK Taman Jaya，四年级',
    ph_parent: '家长/监护人姓名', ph_contact: '+60 12-345 6789',
    ph_email: 'example@email.com', ph_specify: '请注明',
    ph_focus: '任何具体目标、关注点或需重点关注的领域…',
    ph_consultant: '协助您的顾问姓名',
    submit: '提交注册', submitting: '提交中…',
    privacy: '提交此表格即表示您同意接受Triple Tree丰富中心的联系。',
    err_name: '请填写学生姓名。',
    err_contact: '请提供联系电话或电子邮件。',
    err_failed: '提交失败，请重试。',
    success_title: '注册成功',
    success_msg: '感谢您向Triple Tree丰富中心注册。我们的顾问将尽快联系您确认课程时间。',
    level_understand: '明白但不会讲', level_speak_simple: '会讲，不会写和读',
    level_speak_basic: '会说读写（基础）', level_zero: '完全不会',
    level_strong: '强', level_moderate: '中等', level_weak: '弱',
  },
} satisfies Record<Lang, Translation>

const LANGUAGE_LEVELS = (t: Translation) => [
  { value: 'understand_cant_speak', label: t.level_understand },
  { value: 'can_speak_simple',      label: t.level_speak_simple },
  { value: 'can_speak_write_basic', label: t.level_speak_basic },
  { value: 'zero_basic',            label: t.level_zero },
]
const PROFICIENCY = (t: Translation) => [
  { value: 'strong',     label: t.level_strong },
  { value: 'moderate',   label: t.level_moderate },
  { value: 'weak',       label: t.level_weak },
  { value: 'zero_basic', label: t.level_zero },
]

const SUBJECTS = [
  { value: 'english',        en: 'English',           zh: '英文',     color: '#7D6608' },
  { value: 'maths_e',        en: 'Maths (English)',   zh: '英数',     color: '#1E8449' },
  { value: 'maths_m',        en: 'Maths (Mandarin)',  zh: '华数',     color: '#1E8449' },
  { value: 'coding',         en: 'Coding & Robotics', zh: '编程',     color: '#1A5276' },
  { value: 'mandarin',       en: 'Mandarin',          zh: '华文',     color: '#C0392B' },
  { value: 'mandarin_extra', en: 'Mandarin (Extra)',  zh: '华文加强',  color: '#922B21' },
  { value: 'science',        en: 'Science',           zh: '科学',     color: '#117A65' },
]

const SKILLS = [
  { value: 'english_reading',   en: 'English Reading',   zh: '英文阅读' },
  { value: 'english_speaking',  en: 'English Speaking',  zh: '英文演讲' },
  { value: 'mandarin_reading',  en: 'Mandarin Reading',  zh: '华文阅读' },
  { value: 'mandarin_speaking', en: 'Mandarin Speaking', zh: '华文演讲' },
  { value: 'creative_art',      en: 'Creative Art',      zh: '创意绘画' },
  { value: 'calligraphy',       en: 'Calligraphy',       zh: '书法'     },
]

const DARK   = '#0D1B2A'
const GREEN  = '#1E8449'
const BLUE   = '#1A5276'

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionHeading({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-[11px] font-black tracking-widest tabular-nums" style={{ color: GREEN }}>{number}</span>
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  )
}

function FloatInput({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

const inp = [
  'w-full h-11 px-4 rounded-xl text-sm text-gray-900',
  'bg-white border border-gray-200',
  'placeholder:text-gray-300',
  'focus:outline-none focus:border-gray-400 focus:ring-0',
  'transition-colors',
].join(' ')

const textArea = [
  'w-full px-4 py-3 rounded-xl text-sm text-gray-900',
  'bg-white border border-gray-200',
  'placeholder:text-gray-300',
  'focus:outline-none focus:border-gray-400 focus:ring-0',
  'resize-none transition-colors',
].join(' ')

// ── Main ──────────────────────────────────────────────────────────────────────

export default function FormPage() {
  const [lang,       setLang]       = useState<Lang>('en')
  const [data,       setData]       = useState<FormData>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('form_lang') as Lang | null
    if (saved === 'en' || saved === 'zh') setLang(saved)
  }, [])

  function switchLang(l: Lang) { setLang(l); localStorage.setItem('form_lang', l) }
  const t = T[lang]

  function set(field: keyof FormData, value: string) {
    setData(prev => ({ ...prev, [field]: value }))
  }
  function toggleArr(field: 'interested_subjects' | 'interested_skills', value: string) {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value],
    }))
  }

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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8" style={{ background: `${GREEN}12` }}>
          <CheckCircle2 className="w-7 h-7" style={{ color: GREEN }} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{t.success_title}</h1>
        <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{t.success_msg}</p>
        <div className="mt-10 flex items-center gap-2 opacity-30">
          <Image src="/logo.png" alt="Triple Tree" width={18} height={18} className="object-contain" />
          <p className="text-xs text-gray-600 font-medium">Triple Tree Enrichment Centre</p>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white" suppressHydrationWarning>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Triple Tree" width={32} height={32} className="object-contain" />
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: DARK }}>Triple Tree</p>
            <p className="text-[11px] text-gray-400 tracking-wide">Enrichment Centre</p>
          </div>
        </div>
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          {(['en', 'zh'] as const).map(l => (
            <button key={l} onClick={() => switchLang(l)}
              className="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
              style={lang === l
                ? { background: 'white', color: DARK, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { color: '#9ca3af' }
              }>
              {l === 'en' ? 'EN' : '中文'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="px-6 pt-10 pb-8 border-b border-gray-100 max-w-2xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: GREEN }}>
          Triple Tree Enrichment Centre
        </p>
        <h1 className="text-3xl font-bold leading-tight" style={{ color: DARK }}>{t.subtitle}</h1>
        <p className="text-sm text-gray-400 mt-2">Complete the form below and our team will be in touch to arrange your trial session.</p>
      </div>

      {/* ── Form body ──────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 py-10 space-y-12">

        {/* 01 Student */}
        <div>
          <SectionHeading number="01" label={t.section_student} />
          <div className="space-y-4">
            <FloatInput label={t.name} required>
              <input type="text" placeholder={t.ph_name}
                value={data.student_name} onChange={e => set('student_name', e.target.value)}
                className={inp} />
            </FloatInput>
            <div className="grid grid-cols-2 gap-4">
              <FloatInput label={t.age}>
                <input type="number" min={1} max={99} placeholder={t.ph_age}
                  value={data.student_age} onChange={e => set('student_age', e.target.value)}
                  className={inp} />
              </FloatInput>
              <FloatInput label={t.date}>
                <input type="date" value={data.date} onChange={e => set('date', e.target.value)}
                  className={inp} />
              </FloatInput>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FloatInput label={t.dob}>
                <input type="date" value={data.student_dob} onChange={e => set('student_dob', e.target.value)}
                  className={inp} />
              </FloatInput>
              <FloatInput label={t.school}>
                <input type="text" placeholder={t.ph_school}
                  value={data.school_grade} onChange={e => set('school_grade', e.target.value)}
                  className={inp} />
              </FloatInput>
            </div>
          </div>
        </div>

        {/* 02 Parent */}
        <div>
          <SectionHeading number="02" label={t.section_parent} />
          <div className="space-y-4">
            <FloatInput label={t.parent_name}>
              <input type="text" placeholder={t.ph_parent}
                value={data.parent_name} onChange={e => set('parent_name', e.target.value)}
                className={inp} />
            </FloatInput>
            <div className="grid grid-cols-2 gap-4">
              <FloatInput label={t.contact} required>
                <input type="tel" placeholder={t.ph_contact}
                  value={data.contact} onChange={e => set('contact', e.target.value)}
                  className={inp} />
              </FloatInput>
              <FloatInput label={t.email}>
                <input type="email" placeholder={t.ph_email}
                  value={data.email} onChange={e => set('email', e.target.value)}
                  className={inp} />
              </FloatInput>
            </div>
            <FloatInput label={t.dominant_language}>
              <div className="flex gap-2">
                {[
                  { value: 'english',  label: t.lang_en },
                  { value: 'mandarin', label: t.lang_mandarin },
                  { value: 'others',   label: t.lang_others },
                ].map(l => {
                  const sel = data.dominant_language === l.value
                  return (
                    <button key={l.value} type="button" onClick={() => set('dominant_language', l.value)}
                      className="flex-1 h-11 rounded-xl text-sm font-semibold border transition-all"
                      style={sel
                        ? { background: DARK, color: 'white', borderColor: DARK }
                        : { background: 'white', color: '#9CA3AF', borderColor: '#E5E7EB' }
                      }>
                      {l.label}
                    </button>
                  )
                })}
              </div>
              {data.dominant_language === 'others' && (
                <input type="text" placeholder={t.ph_specify}
                  value={data.dominant_language_other}
                  onChange={e => set('dominant_language_other', e.target.value)}
                  className={`${inp} mt-2`} />
              )}
            </FloatInput>
          </div>
        </div>

        {/* 03 Subjects */}
        <div>
          <SectionHeading number="03" label={t.section_subjects} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SUBJECTS.map(s => {
              const sel   = data.interested_subjects.includes(s.value)
              const label = lang === 'en' ? s.en : s.zh
              return (
                <button key={s.value} type="button"
                  onClick={() => toggleArr('interested_subjects', s.value)}
                  className="relative h-12 px-4 rounded-xl border text-sm font-semibold text-left transition-all"
                  style={sel
                    ? { background: s.color, borderColor: s.color, color: 'white' }
                    : { background: 'white', borderColor: '#E5E7EB', color: '#6B7280' }
                  }>
                  {label}
                  {sel && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 text-xs">&#10003;</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 04 Skills */}
        <div>
          <SectionHeading number="04" label={t.section_skills} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SKILLS.map(s => {
              const sel   = data.interested_skills.includes(s.value)
              const label = lang === 'en' ? s.en : s.zh
              return (
                <button key={s.value} type="button"
                  onClick={() => toggleArr('interested_skills', s.value)}
                  className="h-12 px-4 rounded-xl border text-sm font-semibold text-left transition-all relative"
                  style={sel
                    ? { background: DARK, borderColor: DARK, color: 'white' }
                    : { background: 'white', borderColor: '#E5E7EB', color: '#6B7280' }
                  }>
                  {label}
                  {sel && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 text-xs">&#10003;</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 05 Levels */}
        <div>
          <SectionHeading number="05" label={t.section_levels} />
          <div className="space-y-8">

            {/* Mandarin */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{t.mandarin_level}</p>
              <div className="grid grid-cols-1 gap-2">
                {LANGUAGE_LEVELS(t).map(l => {
                  const sel = data.level_mandarin === l.value
                  return (
                    <label key={l.value}
                      className="flex items-center gap-4 h-12 px-4 rounded-xl border cursor-pointer transition-all"
                      style={sel
                        ? { borderColor: '#C0392B', background: '#FEF2F2' }
                        : { borderColor: '#E5E7EB', background: 'white' }
                      }>
                      <input type="radio" name="level_mandarin" value={l.value}
                        checked={sel} onChange={() => set('level_mandarin', l.value)} className="sr-only" />
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: sel ? '#C0392B' : '#D1D5DB' }}>
                        {sel && <div className="w-2 h-2 rounded-full bg-[#C0392B]" />}
                      </div>
                      <span className="text-sm font-medium" style={{ color: sel ? '#C0392B' : '#374151' }}>{l.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* English */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{t.english_level}</p>
              <div className="grid grid-cols-1 gap-2">
                {LANGUAGE_LEVELS(t).map(l => {
                  const sel = data.level_english === l.value
                  return (
                    <label key={l.value}
                      className="flex items-center gap-4 h-12 px-4 rounded-xl border cursor-pointer transition-all"
                      style={sel
                        ? { borderColor: BLUE, background: '#EFF6FF' }
                        : { borderColor: '#E5E7EB', background: 'white' }
                      }>
                      <input type="radio" name="level_english" value={l.value}
                        checked={sel} onChange={() => set('level_english', l.value)} className="sr-only" />
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                        style={{ borderColor: sel ? BLUE : '#D1D5DB' }}>
                        {sel && <div className="w-2 h-2 rounded-full" style={{ background: BLUE }} />}
                      </div>
                      <span className="text-sm font-medium" style={{ color: sel ? BLUE : '#374151' }}>{l.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Maths + Coding */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{t.maths_level}</p>
                <div className="space-y-2">
                  {PROFICIENCY(t).map(p => {
                    const sel = data.level_maths === p.value
                    return (
                      <label key={p.value}
                        className="flex items-center gap-3 h-11 px-3.5 rounded-xl border cursor-pointer transition-all"
                        style={sel
                          ? { borderColor: GREEN, background: '#F0FDF4' }
                          : { borderColor: '#E5E7EB', background: 'white' }
                        }>
                        <input type="radio" name="level_maths" value={p.value}
                          checked={sel} onChange={() => set('level_maths', p.value)} className="sr-only" />
                        <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                          style={{ borderColor: sel ? GREEN : '#D1D5DB' }}>
                          {sel && <div className="w-1.5 h-1.5 rounded-full" style={{ background: GREEN }} />}
                        </div>
                        <span className="text-sm font-medium" style={{ color: sel ? GREEN : '#374151' }}>{p.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{t.coding_level}</p>
                <div className="space-y-2">
                  {PROFICIENCY(t).map(p => {
                    const sel = data.level_coding === p.value
                    return (
                      <label key={p.value}
                        className="flex items-center gap-3 h-11 px-3.5 rounded-xl border cursor-pointer transition-all"
                        style={sel
                          ? { borderColor: BLUE, background: '#EFF6FF' }
                          : { borderColor: '#E5E7EB', background: 'white' }
                        }>
                        <input type="radio" name="level_coding" value={p.value}
                          checked={sel} onChange={() => set('level_coding', p.value)} className="sr-only" />
                        <div className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0"
                          style={{ borderColor: sel ? BLUE : '#D1D5DB' }}>
                          {sel && <div className="w-1.5 h-1.5 rounded-full" style={{ background: BLUE }} />}
                        </div>
                        <span className="text-sm font-medium" style={{ color: sel ? BLUE : '#374151' }}>{p.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 06 Additional */}
        <div>
          <SectionHeading number="06" label={t.section_additional} />
          <div className="space-y-4">
            <FloatInput label={t.focus_area}>
              <textarea rows={4} placeholder={t.ph_focus}
                value={data.focus_area} onChange={e => set('focus_area', e.target.value)}
                className={textArea} />
            </FloatInput>
            <FloatInput label={t.consultant}>
              <input type="text" placeholder={t.ph_consultant}
                value={data.consultant_name} onChange={e => set('consultant_name', e.target.value)}
                className={inp} />
            </FloatInput>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 leading-relaxed mb-6">{t.privacy}</p>
          <button type="submit" disabled={submitting}
            className="w-full h-14 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all hover:opacity-90 active:scale-[0.99]"
            style={{ background: DARK }}>
            {submitting
              ? <><Loader2 className="w-4 h-4 animate-spin" />{t.submitting}</>
              : <>{t.submit}<ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </div>

      </form>
    </div>
  )
}
