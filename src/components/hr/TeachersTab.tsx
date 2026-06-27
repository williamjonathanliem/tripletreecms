'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Pencil, X, Check, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { InviteTeacherDialog } from './InviteTeacherDialog'
import { SubjectBadge } from '@/components/ui/SubjectBadge'
import { SUBJECTS, SUBJECT_META, type Subject } from '@/types'
import type { Teacher } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function EditRow({ teacher, onDone }: { teacher: Teacher & { hr_notes?: string | null }; onDone: () => void }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [role, setRole] = useState<'teacher' | 'hr'>(teacher.role)
  const [subjects, setSubjects] = useState<Subject[]>(teacher.subjects)
  const [hrNotes, setHrNotes] = useState(teacher.hr_notes ?? '')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function toggleSubject(s: Subject) {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('teachers').update({
      role, subjects, hr_notes: hrNotes.trim() || null,
    }).eq('id', teacher.id)
    setSaving(false)
    if (error) { toast.error('Failed to update'); return }
    toast.success('Teacher updated')
    onDone()
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
      <div className="flex gap-2">
        {(['teacher', 'hr'] as const).map(r => (
          <button key={r} type="button" onClick={() => setRole(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              role === r ? 'border-[#1A5276] bg-[#E6F1FB] text-[#1A5276]' : 'border-gray-200 bg-white text-gray-500'
            }`}>
            {r === 'teacher' ? t.hr_teachers.role_teacher : t.hr_teachers.role_hr}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SUBJECTS.map(s => {
          const meta = SUBJECT_META[s]; const sel = subjects.includes(s)
          return (
            <button key={s} type="button" onClick={() => toggleSubject(s)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
              style={sel ? { color: meta.color, background: meta.bg, borderColor: meta.color } : { color: '#9CA3AF', background: '#F9FAFB', borderColor: '#E5E7EB' }}>
              {sel && <Check className="w-3 h-3" />}{meta.label}
            </button>
          )
        })}
      </div>
      {/* Private HR notes */}
      <div className="space-y-1">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
          <Lock className="w-3 h-3" /> {t.hr_teachers.private_hr_notes}
        </label>
        <textarea
          value={hrNotes}
          onChange={e => setHrNotes(e.target.value)}
          rows={3}
          placeholder={t.hr_teachers.hr_notes_placeholder}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 resize-none focus:outline-none focus:border-[#1A5276] transition-colors placeholder:text-gray-300"
        />
      </div>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-60"
          style={{ background: '#1A5276' }}>
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} {t.hr_teachers.save}
        </button>
        <button onClick={onDone} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 bg-white border border-gray-200">
          {t.hr_teachers.cancel}
        </button>
      </div>
    </div>
  )
}

export function TeachersTab({ teachers: initial }: { teachers: Teacher[] }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [teachers, setTeachers] = useState(initial)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => { setTeachers(initial) }, [initial])
  const [deactivating, setDeactivating] = useState<string | null>(null)
  const [confirmDeactivate, setConfirmDeactivate] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function deactivate(id: string) {
    setDeactivating(id)
    setConfirmDeactivate(null)
    const { error } = await supabase.from('teachers').update({ active: false }).eq('id', id)
    setDeactivating(null)
    if (error) { toast.error('Failed to deactivate'); return }
    setTeachers(prev => prev.map(teacher => teacher.id === id ? { ...teacher, active: false } : teacher))
    toast.success('Teacher deactivated')
  }

  async function reactivate(id: string) {
    const { error } = await supabase.from('teachers').update({ active: true }).eq('id', id)
    if (error) { toast.error('Failed to reactivate'); return }
    setTeachers(prev => prev.map(teacher => teacher.id === id ? { ...teacher, active: true } : teacher))
    toast.success('Teacher reactivated')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{teachers.length} {teachers.length !== 1 ? t.hr_teachers.staff_count_plural : t.hr_teachers.staff_count_singular}</p>
        <InviteTeacherDialog onInvited={() => router.refresh()} />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{t.hr_teachers.col_name}</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t.hr_teachers.col_role}</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t.hr_teachers.col_subjects}</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t.hr_teachers.col_joined}</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t.hr_teachers.col_status}</th>
              <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">
                <span className="flex items-center gap-1"><Lock className="w-3 h-3" />{t.hr_teachers.col_notes}</span>
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {teachers.map(teacher => (
              <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                {editingId === teacher.id ? (
                  <td colSpan={6} className="px-5 py-3">
                    <div className="mb-1">
                      <p className="text-sm font-semibold text-gray-900">{teacher.name}</p>
                      <p className="text-xs text-gray-400">{teacher.email}</p>
                    </div>
                    <EditRow teacher={teacher} onDone={() => { setEditingId(null); router.refresh() }} />
                  </td>
                ) : (
                  <>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{teacher.name}</p>
                      <p className="text-xs text-gray-400">{teacher.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        teacher.role === 'hr' ? 'bg-[#E6F1FB] text-[#1A5276]' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {teacher.role === 'hr' ? t.hr_teachers.role_hr : t.hr_teachers.role_teacher}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(teacher.subjects ?? []).map(s => <SubjectBadge key={s} subject={s} />)}
                        {(!teacher.subjects || teacher.subjects.length === 0) && <span className="text-xs text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-500">{formatDate(teacher.created_at)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        teacher.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {teacher.active ? t.hr_teachers.status_active : t.hr_teachers.status_inactive}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[180px]">
                      {(teacher as Teacher & { hr_notes?: string | null }).hr_notes ? (
                        <p className="text-xs text-gray-500 line-clamp-2 italic">
                          {(teacher as Teacher & { hr_notes?: string | null }).hr_notes}
                        </p>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => setEditingId(teacher.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                          <Pencil className="w-3 h-3" /> {t.hr_teachers.edit}
                        </button>
                        {teacher.active ? (
                          confirmDeactivate === teacher.id ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-red-600 font-semibold mr-1">Sure?</span>
                              <button onClick={() => deactivate(teacher.id)} disabled={deactivating === teacher.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
                                {deactivating === teacher.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                Yes
                              </button>
                              <button onClick={() => setConfirmDeactivate(null)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                                No
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeactivate(teacher.id)} disabled={deactivating === teacher.id}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                              <X className="w-3 h-3" /> {t.hr_teachers.deactivate}
                            </button>
                          )
                        ) : (
                          <button onClick={() => reactivate(teacher.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors">
                            <Check className="w-3 h-3" /> {t.hr_teachers.reactivate}
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
