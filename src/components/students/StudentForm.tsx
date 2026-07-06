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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 mb-3">{children}</p>
  )
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
  const [parentName,    setParentName]    = useState(student?.parent_name ?? '')
  const [parentContact, setParentContact] = useState(student?.parent_contact ?? '')
  const [parentEmail,   setParentEmail]   = useState(student?.parent_email ?? '')
  const [notes,         setNotes]         = useState(student?.notes ?? '')
  const [submitting,    setSubmitting]    = useState(false)
  const [errors,        setErrors]        = useState<Record<string, string>>({})

  const [isHR,            setIsHR]            = useState(false)
  const [teachers,        setTeachers]        = useState<{ id: string; name: string }[]>([])
  const [assignedTeacher, setAssignedTeacher] = useState(student?.teacher_id ?? '')
  const [branches,        setBranches]        = useState<string[]>([])
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

      const { data: branchRows } = await supabase
        .from('branches')
        .select('name')
        .eq('active', true)
        .order('name')
      const names = branchRows?.map(r => r.name) ?? []
      setBranches(names.length ? names : ['Mont Kiara'])

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
      enrolled_date: enrolledDate, parent_name: parentName.trim() || null,
      parent_contact: parentContact || null,
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

  const inp = (hasErr?: boolean) =>
    `w-full h-11 px-4 rounded-xl border text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
      hasErr
        ? 'border-red-300 bg-red-50 focus:ring-red-100'
        : 'border-gray-200 bg-white focus:ring-blue-100 focus:border-blue-300'
    }`

  if (loadingMeta) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 px-7 py-6 space-y-7">

        {/* ── Student name ──────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Student Name</SectionLabel>
          <input
            className={inp(!!errors.name)}
            placeholder="e.g. Ahmad Haziq"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1.5">{errors.name}</p>}
        </div>

        {/* ── Subject ───────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Subject</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {SUBJECTS.map(s => {
              const m      = SUBJECT_META[s]
              const active = subject === s
              const label  = m.label
                .replace(' & Robotics', '')
                .replace(' (Extra)', '\nExtra')
                .trim()
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSubjectChange(s)}
                  className="relative flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl border-2 transition-all text-center hover:scale-[1.02]"
                  style={active
                    ? { background: m.bg, borderColor: m.color }
                    : { background: '#FAFAFA', borderColor: '#EBEBEB' }
                  }
                >
                  {active && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: m.color }} />
                  )}
                  <span
                    className="text-[11px] font-bold leading-tight whitespace-pre-line"
                    style={{ color: active ? m.color : '#B0B0B0' }}
                  >
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Tier (coding only) ────────────────────────────────────────── */}
        {isCoding && (
          <div>
            <SectionLabel>Class Tier</SectionLabel>
            <Select value={tier} onValueChange={v => { if (v) setTier(v) }}>
              <SelectTrigger className={`h-11 rounded-xl text-sm ${errors.tier ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                <SelectValue placeholder="Select a tier…" />
              </SelectTrigger>
              <SelectContent>
                {TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.tier && <p className="text-xs text-red-500 mt-1.5">{errors.tier}</p>}
          </div>
        )}

        {/* ── Enrolment details ─────────────────────────────────────────── */}
        <div>
          <SectionLabel>Enrolment Details</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-gray-400 mb-1.5 block">Age</label>
              <input
                type="number" placeholder="10" min={4} max={18}
                className={inp(!!errors.age)}
                value={age} onChange={e => setAge(e.target.value)}
              />
              {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
            </div>
            <div>
              <label className="text-[11px] text-gray-400 mb-1.5 block">Enrolled Date</label>
              <input
                type="date"
                className={inp(!!errors.enrolled_date)}
                value={enrolledDate} onChange={e => setEnrolledDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 mb-1.5 block">Branch</label>
              <div className="relative">
                <select
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  className={`${inp(!!errors.branch)} pr-8 appearance-none cursor-pointer`}
                >
                  <option value="">Select…</option>
                  {branches.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Assign teacher (HR only) ──────────────────────────────────── */}
        {isHR && (
          <div>
            <SectionLabel>Assign Teacher</SectionLabel>
            <div className="relative">
              <select
                value={assignedTeacher}
                onChange={e => setAssignedTeacher(e.target.value)}
                className={`${inp(!!errors.teacher)} pr-8 appearance-none cursor-pointer`}
              >
                <option value="">Select a teacher…</option>
                {teachers.map(tc => (
                  <option key={tc.id} value={tc.id}>{tc.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.teacher && <p className="text-xs text-red-500 mt-1.5">{errors.teacher}</p>}
          </div>
        )}

        {/* ── Parent info ───────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Parent / Guardian</SectionLabel>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-gray-400 mb-1.5 block">Parent Name</label>
              <input
                placeholder="e.g. Puan Siti"
                className={inp()}
                value={parentName} onChange={e => setParentName(e.target.value)}
              />
            </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-gray-400 mb-1.5 block">Contact Number</label>
              <input
                placeholder="60 12-345 6789"
                className={inp()}
                value={parentContact} onChange={e => setParentContact(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-400 mb-1.5 block">Email Address</label>
              <input
                type="email" placeholder="parent@email.com"
                className={inp()}
                value={parentEmail} onChange={e => setParentEmail(e.target.value)}
              />
            </div>
          </div>
          </div>
        </div>

        {/* ── Notes ─────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Notes</SectionLabel>
          <textarea
            rows={3}
            placeholder="Any extra info — schedule, allergies, learning notes…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none transition-all"
            value={notes} onChange={e => setNotes(e.target.value)}
          />
        </div>

      </div>

      {/* ── Sticky footer ──────────────────────────────────────────────── */}
      <div className="shrink-0 px-7 py-5 border-t border-gray-100 bg-white flex items-center gap-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-all active:scale-[0.99]"
          style={{ background: accentColor }}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? t.students.save_changes : t.students.add_student}
        </button>
      </div>
    </form>
  )
}
