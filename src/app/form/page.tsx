'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────

type Lang = 'en' | 'zh'

type Translation = {
  subtitle: string; section_student: string; section_parent: string
  section_subjects: string; section_skills: string; section_levels: string; section_additional: string
  date: string; age: string; name: string; dob: string; school: string
  parent_name: string; contact: string; email: string; dominant_language: string; specify: string
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
  date: string
  student_name: string
  student_age: string
  student_dob: string
  school_grade: string
  parent_name: string
  contact: string
  email: string
  dominant_language: string
  dominant_language_other: string
  interested_subjects: string[]
  interested_skills: string[]
  level_mandarin: string
  level_english: string
  level_maths: string
  level_coding: string
  focus_area: string
  consultant_name: string
}

const EMPTY: FormData = {
  date: '', student_name: '', student_age: '', student_dob: '',
  school_grade: '', parent_name: '', contact: '',
  email: '', dominant_language: '', dominant_language_other: '',
  interested_subjects: [], interested_skills: [],
  level_mandarin: '', level_english: '', level_maths: '', level_coding: '',
  focus_area: '', consultant_name: '',
}

// ── Translations ───────────────────────────────────────────────────

const T = {
  en: {
    subtitle: 'Student Registration Form',
    section_student: 'Student Information',
    section_parent: 'Parent / Contact',
    section_subjects: 'Interested Subject (Academic)',
    section_skills: 'Interested Skill / Enrichment',
    section_levels: "Child's Current Level",
    section_additional: 'Additional Information',

    date: 'Date', age: 'Student Age', name: 'Student Name', dob: 'Date of Birth',
    school: 'School / Grade',
    parent_name: 'Parent Name', contact: 'Contact', email: 'Email',
    dominant_language: 'Dominant Language', specify: 'Please specify',
    focus_area: 'Focus Area', consultant: 'Consultant Name',

    mandarin_level: 'Mandarin Level', english_level: 'English Level',
    maths_level: 'Maths', coding_level: 'Coding',

    lang_en: 'English', lang_mandarin: 'Mandarin', lang_others: 'Others',

    ph_name: 'Full name', ph_age: 'e.g. 10', ph_school: 'e.g. SK Taman Jaya, Year 4',
    ph_parent: 'Parent / guardian name', ph_contact: '+60 12-345 6789',
    ph_email: 'example@email.com', ph_specify: 'Please specify',
    ph_focus: 'Any specific goals, concerns, or areas to focus on…',
    ph_consultant: 'Name of the consultant who assisted you',

    submit: 'Submit Registration',
    submitting: 'Submitting…',
    privacy: 'By submitting this form, you agree to be contacted by Triple Tree Enrichment Centre.',

    err_name: 'Student name is required',
    err_contact: 'Please provide a contact number or email',
    err_failed: 'Submission failed. Please try again.',

    success_title: 'Thank You!',
    success_msg: 'We have received your registration. Our team will be in touch soon.',

    level_understand: "Understand, Can't Speak",
    level_speak_simple: "Can Speak, Can't Read & Write (Simple Comm.)",
    level_speak_basic: 'Can Speak, Write & Reading in Basic Level',
    level_zero: 'Zero Basic',
    level_strong: 'Strong', level_moderate: 'Moderate',
    level_weak: 'Weak',
  },
  zh: {
    subtitle: '学生注册表',
    section_student: '学生资料',
    section_parent: '家长联系资料',
    section_subjects: '关注课目',
    section_skills: '关注技能/素质',
    section_levels: '学生程度',
    section_additional: '其他资料',

    date: '日期', age: '岁数', name: '学生名字', dob: '生日日期',
    school: '学校/班级',
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

    submit: '提交注册',
    submitting: '提交中…',
    privacy: '提交此表格即表示您同意接受Triple Tree丰富中心的联系。',

    err_name: '请填写学生姓名',
    err_contact: '请提供联系电话或电子邮件',
    err_failed: '提交失败，请重试。',

    success_title: '谢谢您！',
    success_msg: '我们已收到您的注册表，我们的团队将尽快与您联系。',

    level_understand: '明白但不会讲',
    level_speak_simple: '会讲，不会写和读',
    level_speak_basic: '会说读写（基础）',
    level_zero: '完全不会',
    level_strong: '强', level_moderate: '中等',
    level_weak: '弱',
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
  { value: 'english',  en: 'English',   zh: '英文' },
  { value: 'maths_e',  en: 'Maths (E)', zh: '英数' },
  { value: 'maths_m',  en: 'Maths (M)', zh: '华数' },
  { value: 'coding',   en: 'Coding',    zh: '编程' },
  { value: 'mandarin', en: 'Mandarin',  zh: '华文' },
  { value: 'science',  en: 'Science',   zh: '科学' },
]

const SKILLS = [
  { value: 'english_reading',   en: 'English Reading',   zh: '英文阅读' },
  { value: 'english_speaking',  en: 'English Speaking',  zh: '英文演讲' },
  { value: 'mandarin_reading',  en: 'Mandarin Reading',  zh: '华文阅读' },
  { value: 'mandarin_speaking', en: 'Mandarin Speaking', zh: '华文演讲' },
  { value: 'creative_art',      en: 'Creative Art',      zh: '创意绘画' },
  { value: 'calligraphy',       en: 'Calligraphy',       zh: '书法' },
]

// ── Sub-components ────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="bg-gray-800 text-white px-4 py-2.5 rounded-lg">
      <span className="text-sm font-bold tracking-wide">{label}</span>
    </div>
  )
}

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-800">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = "w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors"

// ── Main component ────────────────────────────────────────────────

export default function FormPage() {
  // Always start 'en' so server and client agree; sync pref after mount
  const [lang, setLang] = useState<Lang>('en')
  const [data, setData] = useState<FormData>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const saved = localStorage.getItem('form_lang') as Lang | null
    if (saved === 'en' || saved === 'zh') setLang(saved)
  }, [])

  function switchLang(l: Lang) {
    setLang(l)
    localStorage.setItem('form_lang', l)
  }

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
      date: data.date || new Date().toISOString().split('T')[0],
      student_name: data.student_name.trim(),
      student_age: data.student_age ? parseInt(data.student_age) : null,
      student_dob: data.student_dob || null,
      school_grade: data.school_grade || null,
      parent_name: data.parent_name || null,
      contact: data.contact || null,
      email: data.email || null,
      dominant_language: data.dominant_language || null,
      dominant_language_other: data.dominant_language_other || null,
      interested_subjects: data.interested_subjects,
      interested_skills: data.interested_skills,
      level_mandarin: data.level_mandarin || null,
      level_english: data.level_english || null,
      level_maths: data.level_maths || null,
      level_coding: data.level_coding || null,
      focus_area: data.focus_area || null,
      consultant_name: data.consultant_name || null,
    })

    setSubmitting(false)
    if (error) { toast.error(t.err_failed); return }
    setSubmitted(true)
  }

  // ── Success state ──────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-[#1E8449]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t.success_title}</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{t.success_msg}</p>
        </div>
      </div>
    )
  }

  // ── Form ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-12" suppressHydrationWarning>
      {/* Header */}
      <div className="bg-[#1E8449] px-4 py-5">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Triple Tree" width={40} height={40}
              className="rounded-xl bg-white/10 p-1 object-contain shrink-0" />
            <div>
              <p className="text-white font-bold text-base leading-tight">Triple Tree Enrichment Centre</p>
              <p className="text-white/65 text-xs mt-0.5">{t.subtitle}</p>
            </div>
          </div>
          {/* Language toggle */}
          <div className="flex items-center bg-white/15 rounded-lg p-0.5 shrink-0">
            <button onClick={() => switchLang('en')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                lang === 'en' ? 'bg-white text-[#1E8449]' : 'text-white/80 hover:text-white'
              }`}>
              EN
            </button>
            <button onClick={() => switchLang('zh')}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                lang === 'zh' ? 'bg-white text-[#1E8449]' : 'text-white/80 hover:text-white'
              }`}>
              中文
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 mt-6 space-y-5">

        {/* ── Student Info ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <SectionTitle label={t.section_student} />
          </div>
          <div className="p-5 space-y-4">
            <Field label={t.name} required>
              <input type="text" placeholder={t.ph_name}
                value={data.student_name} onChange={e => set('student_name', e.target.value)}
                className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t.date}>
                <input type="date" value={data.date} onChange={e => set('date', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label={t.age}>
                <input type="number" min={1} max={99} placeholder={t.ph_age}
                  value={data.student_age} onChange={e => set('student_age', e.target.value)}
                  className={inputCls} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t.dob}>
                <input type="date" value={data.student_dob} onChange={e => set('student_dob', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label={t.school}>
                <input type="text" placeholder={t.ph_school}
                  value={data.school_grade} onChange={e => set('school_grade', e.target.value)}
                  className={inputCls} />
              </Field>
            </div>

          </div>
        </div>

        {/* ── Parent / Contact ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <SectionTitle label={t.section_parent} />
          </div>
          <div className="p-5 space-y-4">
            <Field label={t.parent_name}>
              <input type="text" placeholder={t.ph_parent}
                value={data.parent_name} onChange={e => set('parent_name', e.target.value)}
                className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label={t.contact}>
                <input type="tel" placeholder={t.ph_contact}
                  value={data.contact} onChange={e => set('contact', e.target.value)}
                  className={inputCls} />
              </Field>
              <Field label={t.email}>
                <input type="email" placeholder={t.ph_email}
                  value={data.email} onChange={e => set('email', e.target.value)}
                  className={inputCls} />
              </Field>
            </div>

            <Field label={t.dominant_language}>
              <div className="flex gap-2">
                {[
                  { value: 'english',  label: t.lang_en },
                  { value: 'mandarin', label: t.lang_mandarin },
                  { value: 'others',   label: t.lang_others },
                ].map(l => (
                  <button key={l.value} type="button" onClick={() => set('dominant_language', l.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      data.dominant_language === l.value
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}>
                    {l.label}
                  </button>
                ))}
              </div>
              {data.dominant_language === 'others' && (
                <input type="text" placeholder={t.ph_specify}
                  value={data.dominant_language_other}
                  onChange={e => set('dominant_language_other', e.target.value)}
                  className={`${inputCls} mt-2`} />
              )}
            </Field>
          </div>
        </div>

        {/* ── Interested Subjects ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <SectionTitle label={t.section_subjects} />
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUBJECTS.map(s => {
                const sel = data.interested_subjects.includes(s.value)
                return (
                  <button key={s.value} type="button" onClick={() => toggleArr('interested_subjects', s.value)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                      sel ? 'bg-[#1E8449] text-white border-[#1E8449]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}>
                    {lang === 'en' ? s.en : s.zh}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Interested Skills ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <SectionTitle label={t.section_skills} />
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-2">
              {SKILLS.map(s => {
                const sel = data.interested_skills.includes(s.value)
                return (
                  <button key={s.value} type="button" onClick={() => toggleArr('interested_skills', s.value)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                      sel ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}>
                    {lang === 'en' ? s.en : s.zh}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Child Levels ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <SectionTitle label={t.section_levels} />
          </div>
          <div className="p-5 space-y-6">

            {/* Mandarin */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">{t.mandarin_level}</p>
              <div className="space-y-1.5">
                {LANGUAGE_LEVELS(t).map(l => (
                  <label key={l.value}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                      data.level_mandarin === l.value ? 'border-[#1E8449] bg-green-50' : 'border-gray-100 hover:border-gray-200'
                    }`}>
                    <input type="radio" name="level_mandarin" value={l.value}
                      checked={data.level_mandarin === l.value}
                      onChange={() => set('level_mandarin', l.value)}
                      className="accent-[#1E8449] shrink-0" />
                    <span className="text-xs font-semibold text-gray-800">{l.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* English */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">{t.english_level}</p>
              <div className="space-y-1.5">
                {LANGUAGE_LEVELS(t).map(l => (
                  <label key={l.value}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                      data.level_english === l.value ? 'border-[#1A5276] bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                    }`}>
                    <input type="radio" name="level_english" value={l.value}
                      checked={data.level_english === l.value}
                      onChange={() => set('level_english', l.value)}
                      className="accent-[#1A5276] shrink-0" />
                    <span className="text-xs font-semibold text-gray-800">{l.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Maths + Coding */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">{t.maths_level}</p>
                <div className="space-y-1.5">
                  {PROFICIENCY(t).map(p => (
                    <label key={p.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        data.level_maths === p.value ? 'border-amber-400 bg-amber-50' : 'border-gray-100 hover:border-gray-200'
                      }`}>
                      <input type="radio" name="level_maths" value={p.value}
                        checked={data.level_maths === p.value}
                        onChange={() => set('level_maths', p.value)}
                        className="accent-amber-500 shrink-0" />
                      <span className="text-xs font-semibold text-gray-800">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">{t.coding_level}</p>
                <div className="space-y-1.5">
                  {PROFICIENCY(t).map(p => (
                    <label key={p.value}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        data.level_coding === p.value ? 'border-[#1A5276] bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                      }`}>
                      <input type="radio" name="level_coding" value={p.value}
                        checked={data.level_coding === p.value}
                        onChange={() => set('level_coding', p.value)}
                        className="accent-[#1A5276] shrink-0" />
                      <span className="text-xs font-semibold text-gray-800">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Focus Area + Consultant ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <SectionTitle label={t.section_additional} />
          </div>
          <div className="p-5 space-y-4">
            <Field label={t.focus_area}>
              <textarea rows={3} placeholder={t.ph_focus}
                value={data.focus_area} onChange={e => set('focus_area', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-gray-400 transition-colors resize-none" />
            </Field>
            <Field label={t.consultant}>
              <input type="text" placeholder={t.ph_consultant}
                value={data.consultant_name} onChange={e => set('consultant_name', e.target.value)}
                className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={submitting}
          className="w-full h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: '#1E8449' }}>
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? t.submitting : t.submit}
        </button>

        <p className="text-center text-xs text-gray-400 pb-4">{t.privacy}</p>
      </form>
    </div>
  )
}
