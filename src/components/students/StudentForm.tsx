'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TIERS, SUBJECTS, SUBJECT_META } from '@/types'
import { CURRICULUM } from '@/lib/curriculum'
import { createClient } from '@/lib/supabase/client'
import type { Student, Subject } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

interface Props {
  student?: Student
  onClose?: () => void
}

const SUBJECT_EMOJI: Record<string, string> = {
  coding:        '💻',
  chinese:       '📖',
  chinese_extra: '🀄',
  english:       '🔤',
  maths:         '📐',
  science:       '🔬',
  calligraphy:   '✒️',
  arts:          '🎨',
}

function getInitials(name: string) {
  return name.trim().split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export function StudentForm({ student, onClose }: Props) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!student

  const [name,          setName]          = useState(student?.name ?? '')
  const [age,           setAge]           = useState(student ? String(student.age) : '')
  const [subject,       setSubject]       = useState<Subject>(student?.subject ?? 'coding')
  const [tier,          setTier]          = useState(student?.tier ?? '')
  const [branch,        setBranch]        = useState(student?.branch ?? '')
  const [enrolledDate,  setEnrolledDate]  = useState(student?.enrolled_date ?? new Date().toISOString().split('T')[0])
  const [parentContact, setParentContact] = useState(student?.parent_contact ?? '')
  const [parentEmail,   setParentEmail]   = useState(student?.parent_email ?? '')
  const [notes,         setNotes]         = useState(student?.notes ?? '')
  const [submitting,    setSubmitting]    = useState(false)
  const [errors,        setErrors]        = useState<Record<string, string>>({})

  // HR-specific: detect role + load teachers for assignment
  const [isHR,            setIsHR]            = useState(false)
  const [teachers,        setTeachers]        = useState<{ id: string; name: string }[]>([])
  const [assignedTeacher, setAssignedTeacher] = useState(student?.teacher_id ?? '')
  const [loadingMeta,     setLoadingMeta]     = useState(true)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingMeta(false); return }

      const { data: me } = await supabase
        .from('teachers')
        .select('id, role')
        .eq('id', user.id)
        .single()

      if (me?.role === 'hr') {
        setIsHR(true)
        const { data: list } = await supabase
          .from('teachers')
          .select('id, name')
          .eq('active', true)
          .neq('role', 'hr')
          .order('name')
        setTeachers(list ?? [])
      }
      setLoadingMeta(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isCoding    = subject === 'coding'
  const subjectMeta = SUBJECT_META[subject]
  const accentColor = subjectMeta?.color ?? '#1A5276'

  function handleSubjectChange(s: Subject) {
    setSubject(s)
    if (s !== 'coding') setTier('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = t.students.error_name
    const ageNum = Number(age)
    if (!age || isNaN(ageNum) || ageNum < 4 || ageNum > 18) errs.age = t.students.error_age
    if (isCoding && !tier) errs.tier = t.students.error_tier
    if (!branch.trim()) errs.branch = t.students.error_branch
    if (!enrolledDate) errs.enrolled_date = t.students.error_enrolled_date
    if (isHR && !isEditing && !assignedTeacher) errs.teacher = 'Please assign a teacher'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const resolvedTier = isCoding ? tier : subjectMeta.label
    const module_total = isCoding ? (CURRICULUM[resolvedTier]?.length ?? 7) : 1
    const teacher_id   = isHR && assignedTeacher ? assignedTeacher : user.id

    const payload = {
      name: name.trim(), age: ageNum, subject, tier: resolvedTier, branch: branch.trim(),
      enrolled_date: enrolledDate, parent_contact: parentContact || null,
      parent_email: parentEmail.trim().toLowerCase() || null,
      notes: notes || null, teacher_id, module_total,
      module_current: isEditing ? student.module_current : 0,
    }

    if (isEditing) {
      const { error } = await supabase.from('students').update(payload).eq('id', student.id)
      if (error) { toast.error('Failed to update student'); setSubmitting(false); return }
      toast.success('Student updated')
    } else {
      const { error } = await supabase.from('students').insert(payload)
      if (error) { toast.error(`Failed to add student: ${error.message}`); setSubmitting(false); return }
      toast.success('Student added')
    }
    router.refresh()
    onClose?.()
  }

  const inp    = "w-full h-10 px-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all"
  const inpErr = "ring-2 ring-red-200 border-red-200"

  if (loadingMeta) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>

      {/* ── Header: avatar + name ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4 p-5 pb-4 border-b border-gray-100">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 transition-colors"
          style={{ backgroundColor: accentColor }}
        >
          {getInitials(name)}
        </div>
        <div className="flex-1 min-w-0">
          <input
            className="w-full text-lg font-bold text-gray-900 bg-transparent border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none pb-1 placeholder:text-gray-300 transition-colors"
            placeholder={t.students.name_placeholder}
            value={name}
            onChange={e => setName(e.target.value)}
          />
          {errors.name
            ? <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            : <p className="text-xs text-gray-400 mt-1">{t.students.full_name}</p>
          }
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Subject grid ─────────────────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">
            {t.students.subject ?? 'Subject'}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {SUBJECTS.map(s => {
              const m      = SUBJECT_META[s]
              const active = subject === s
              // Short label: strip long suffixes for compact display
              const shortLabel = m.label
                .replace('& Robotics', '')
                .replace('(Extra)', 'Extra')
                .trim()
              return (
                <button
                  key={s} type="button"
                  onClick={() => handleSubjectChange(s)}
                  className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-center transition-all hover:scale-[1.02]"
                  style={active
                    ? { background: m.bg, borderColor: m.color }
                    : { background: '#F9FAFB', borderColor: '#F3F4F6' }
                  }
                >
                  <span className="text-base leading-none">{SUBJECT_EMOJI[s]}</span>
                  <span className="text-[10px] font-bold leading-tight px-0.5 mt-0.5"
                    style={{ color: active ? m.color : '#9CA3AF' }}>
                    {shortLabel}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Tier (coding only) ───────────────────────────────────────────── */}
        {isCoding && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{t.students.tier}</p>
            <Select value={tier} onValueChange={v => { if (v) setTier(v) }}>
              <SelectTrigger className={`h-10 rounded-xl border-gray-100 bg-gray-50 ${errors.tier ? inpErr : ''}`}>
                <SelectValue placeholder={t.students.tier_placeholder} />
              </SelectTrigger>
              <SelectContent>
                {TIERS.map(tier => <SelectItem key={tier} value={tier}>{tier}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.tier && <p className="text-xs text-red-500 mt-1">{errors.tier}</p>}
          </div>
        )}

        {/* ── Age / Date / Branch ──────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{t.students.age}</p>
            <input type="number" placeholder="10"
              className={`${inp} ${errors.age ? inpErr : ''}`}
              value={age} onChange={e => setAge(e.target.value)} />
            {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{t.students.enrolled_date}</p>
            <input type="date"
              className={`${inp} ${errors.enrolled_date ? inpErr : ''}`}
              value={enrolledDate} onChange={e => setEnrolledDate(e.target.value)} />
            {errors.enrolled_date && <p className="text-xs text-red-500 mt-1">{errors.enrolled_date}</p>}
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{t.students.branch}</p>
            <input placeholder="Mont Kiara"
              className={`${inp} ${errors.branch ? inpErr : ''}`}
              value={branch} onChange={e => setBranch(e.target.value)} />
            {errors.branch && <p className="text-xs text-red-500 mt-1">{errors.branch}</p>}
          </div>
        </div>

        {/* ── HR only: assign teacher ──────────────────────────────────────── */}
        {isHR && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Assign Teacher</p>
            <div className="relative">
              <select
                value={assignedTeacher}
                onChange={e => setAssignedTeacher(e.target.value)}
                className={`${inp} pr-8 appearance-none cursor-pointer ${errors.teacher ? inpErr : ''}`}
              >
                <option value="">— Select a teacher —</option>
                {teachers.map(tc => (
                  <option key={tc.id} value={tc.id}>{tc.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.teacher && <p className="text-xs text-red-500 mt-1">{errors.teacher}</p>}
          </div>
        )}

        {/* ── Parent info ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{t.students.parent_contact}</p>
            <input placeholder="60 12-345 6789"
              className={inp}
              value={parentContact} onChange={e => setParentContact(e.target.value)} />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">Parent Email</p>
            <input type="email" placeholder="parent@email.com"
              className={inp}
              value={parentEmail} onChange={e => setParentEmail(e.target.value)} />
          </div>
        </div>

        {/* ── Notes ───────────────────────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">{t.students.notes}</p>
          <textarea
            className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none transition-all"
            placeholder={t.students.notes_placeholder}
            rows={2}
            value={notes} onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* ── Actions ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 px-5 pb-5">
        {onClose && (
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            {t.common.cancel}
          </button>
        )}
        <button type="submit" disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-opacity active:scale-[0.99]"
          style={{ background: accentColor }}>
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? t.students.save_changes : t.students.add_student}
        </button>
      </div>
    </form>
  )
}
