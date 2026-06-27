'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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

const inputClass = "w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1E8449] focus:ring-1 focus:ring-[#1E8449] transition-colors"
const textareaClass = "w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1E8449] focus:ring-1 focus:ring-[#1E8449] transition-colors resize-none"

export function StudentForm({ student, onClose }: Props) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!student

  const [name, setName] = useState(student?.name ?? '')
  const [age, setAge] = useState(student ? String(student.age) : '')
  const [subject, setSubject] = useState<Subject>(student?.subject ?? 'coding')
  const [tier, setTier] = useState(student?.tier ?? '')
  const [branch, setBranch] = useState(student?.branch ?? '')
  const [enrolledDate, setEnrolledDate] = useState(student?.enrolled_date ?? new Date().toISOString().split('T')[0])
  const [parentContact, setParentContact] = useState(student?.parent_contact ?? '')
  const [parentEmail, setParentEmail] = useState(student?.parent_email ?? '')
  const [notes, setNotes] = useState(student?.notes ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isCoding = subject === 'coding'

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

    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const resolvedTier = isCoding ? tier : SUBJECT_META[subject].label
    const module_total = isCoding ? (CURRICULUM[resolvedTier]?.length ?? 7) : 1

    const payload = {
      name: name.trim(),
      age: ageNum,
      subject,
      tier: resolvedTier,
      branch: branch.trim(),
      enrolled_date: enrolledDate,
      parent_contact: parentContact || null,
      parent_email: parentEmail.trim().toLowerCase() || null,
      notes: notes || null,
      teacher_id: user.id,
      module_total,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">

        {/* Name */}
        <div className="col-span-2 space-y-1.5">
          <Label>{t.students.full_name}</Label>
          <input
            className={inputClass}
            placeholder={t.students.name_placeholder}
            value={name}
            onChange={e => setName(e.target.value)}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* Subject chips */}
        <div className="col-span-2 space-y-1.5">
          <Label>{t.students.subject ?? 'Subject'}</Label>
          <div className="flex gap-2 flex-wrap">
            {SUBJECTS.map(s => {
              const meta = SUBJECT_META[s]
              const active = subject === s
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSubjectChange(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={active
                    ? { color: meta.color, background: meta.bg, borderColor: meta.color }
                    : { color: '#9CA3AF', borderColor: '#E5E7EB', background: 'white' }}
                >
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tier — coding only */}
        {isCoding && (
          <div className="col-span-2 space-y-1.5">
            <Label>{t.students.tier}</Label>
            <Select value={tier} onValueChange={v => { if (v) setTier(v) }}>
              <SelectTrigger>
                <SelectValue placeholder={t.students.tier_placeholder} />
              </SelectTrigger>
              <SelectContent>
                {TIERS.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tier && <p className="text-xs text-red-500">{errors.tier}</p>}
          </div>
        )}

        {/* Age + Enrolled Date */}
        <div className="space-y-1.5">
          <Label>{t.students.age}</Label>
          <input
            type="number"
            className={inputClass}
            placeholder={t.students.age_placeholder}
            value={age}
            onChange={e => setAge(e.target.value)}
          />
          {errors.age && <p className="text-xs text-red-500">{errors.age}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>{t.students.enrolled_date}</Label>
          <input
            type="date"
            className={inputClass}
            value={enrolledDate}
            onChange={e => setEnrolledDate(e.target.value)}
          />
          {errors.enrolled_date && <p className="text-xs text-red-500">{errors.enrolled_date}</p>}
        </div>

        {/* Branch */}
        <div className="col-span-2 space-y-1.5">
          <Label>{t.students.branch}</Label>
          <input
            className={inputClass}
            placeholder={t.students.branch_placeholder}
            value={branch}
            onChange={e => setBranch(e.target.value)}
          />
          {errors.branch && <p className="text-xs text-red-500">{errors.branch}</p>}
        </div>

        {/* Parent Contact */}
        <div className="col-span-2 space-y-1.5">
          <Label>{t.students.parent_contact}</Label>
          <input
            className={inputClass}
            placeholder={t.students.parent_placeholder}
            value={parentContact}
            onChange={e => setParentContact(e.target.value)}
          />
        </div>

        {/* Parent Email (for portal access) */}
        <div className="col-span-2 space-y-1.5">
          <Label>Parent Email <span className="text-gray-400 font-normal text-xs">(for parent portal)</span></Label>
          <input
            type="email"
            className={inputClass}
            placeholder="parent@email.com"
            value={parentEmail}
            onChange={e => setParentEmail(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div className="col-span-2 space-y-1.5">
          <Label>{t.students.notes}</Label>
          <textarea
            className={textareaClass}
            placeholder={t.students.notes_placeholder}
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" className="bg-[#1E8449] hover:bg-[#196F3D]" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? t.students.save_changes : t.students.add_student}
        </Button>
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>{t.common.cancel}</Button>
        )}
      </div>
    </form>
  )
}
