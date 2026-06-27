'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Loader2, Trash2, AlertTriangle, Check, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { classSchema, type ClassInput } from '@/lib/validations'
import { TIERS, TIER_COLORS, CLASS_OPTIONS, DAYS, type ClassGroup } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

const labelClass = 'text-xs font-semibold uppercase tracking-wide text-gray-500'
const inputClass = 'w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:border-[#1E8449] focus:bg-white transition-colors'

type RosterStudent = { id: string; name: string; branch: string }

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface Props {
  cls: ClassGroup
  compact?: boolean  // smaller trigger button for use in headers
}

export function EditClassDialog({ cls, compact }: Props) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'info' | 'roster'>('info')
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [available, setAvailable] = useState<RosterStudent[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [addingStudents, setAddingStudents] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const color = TIER_COLORS[cls.tier] || '#6B7280'
  const router = useRouter()
  const supabase = createClient()

  const { register, setValue, watch, reset, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ClassInput>({
      resolver: standardSchemaResolver(classSchema),
      defaultValues: {
        tier: cls.tier, branch: cls.branch,
        schedule_day: cls.schedule_day ?? '', schedule_time: cls.schedule_time ?? '09:00',
      },
    })

  async function loadRoster() {
    setLoadingRoster(true)
    const { data: rosterData } = await supabase
      .from('class_students')
      .select('student_id, student:students(id, name, branch)')
      .eq('class_id', cls.id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentRoster = (rosterData ?? []).map(r => r.student as any as RosterStudent)
    setRoster(currentRoster)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const rosterIds = new Set(currentRoster.map(s => s.id))
      const { data: allStudents } = await supabase
        .from('students').select('id, name, branch')
        .eq('teacher_id', user.id).eq('tier', cls.tier).order('name')
      setAvailable((allStudents ?? []).filter(s => !rosterIds.has(s.id)))
    }
    setLoadingRoster(false)
  }

  function handleOpen() {
    reset({ tier: cls.tier, branch: cls.branch, schedule_day: cls.schedule_day ?? '', schedule_time: cls.schedule_time ?? '09:00' })
    setTab('info')
    setConfirmDelete(false)
    setSelectedIds(new Set())
    setOpen(true)
    loadRoster()
  }

  async function saveInfo(data: ClassInput) {
    const { error } = await supabase.from('classes').update(data).eq('id', cls.id)
    if (error) { toast.error('Failed to update class'); return }
    toast.success('Class updated')
    router.refresh()
  }

  async function removeStudent(studentId: string) {
    const { error } = await supabase.from('class_students')
      .delete().eq('class_id', cls.id).eq('student_id', studentId)
    if (error) { toast.error('Failed to remove student'); return }
    const removed = roster.find(s => s.id === studentId)!
    setRoster(prev => prev.filter(s => s.id !== studentId))
    setAvailable(prev => [...prev, removed].sort((a, b) => a.name.localeCompare(b.name)))
    toast.success('Student removed')
  }

  async function addSelected() {
    setAddingStudents(true)
    const { error } = await supabase.from('class_students').insert(
      Array.from(selectedIds).map(student_id => ({ class_id: cls.id, student_id }))
    )
    if (error) { toast.error('Failed to add students'); setAddingStudents(false); return }
    const added = available.filter(s => selectedIds.has(s.id))
    setRoster(prev => [...prev, ...added])
    setAvailable(prev => prev.filter(s => !selectedIds.has(s.id)))
    setSelectedIds(new Set())
    setAddingStudents(false)
    toast.success(`${added.length} student${added.length !== 1 ? 's' : ''} added`)
    router.refresh()
  }

  async function handleDelete() {
    const { error } = await supabase.from('classes').delete().eq('id', cls.id)
    if (error) { toast.error('Failed to delete class'); return }
    toast.success('Class deleted')
    setOpen(false)
    router.push('/classes')
  }

  function toggleAvailable(id: string) {
    setSelectedIds(prev => {
      const s = new Set(prev)
      if (s.has(id)) { s.delete(id) } else { s.add(id) }
      return s
    })
  }

  return (
    <>
      <button onClick={handleOpen}
        className={`flex items-center gap-1.5 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors ${compact ? 'px-3 py-1.5' : 'px-3 py-2'}`}>
        <Pencil className="w-3.5 h-3.5" /> {t.common.edit}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-9 rounded-full" style={{ backgroundColor: color }} />
              <div>
                <DialogTitle className="text-base">{cls.tier}</DialogTitle>
                <p className="text-xs text-gray-500 mt-0.5">{cls.branch}</p>
              </div>
            </div>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl shrink-0">
            {(['info', 'roster'] as const).map(tabKey => (
              <button key={tabKey} onClick={() => setTab(tabKey)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tab === tabKey ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {tabKey === 'info' ? t.classes.class_info_tab : `${t.classes.roster_tab} (${roster.length})`}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 min-h-0">
            {tab === 'info' ? (
              <form onSubmit={handleSubmit(saveInfo)} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className={labelClass}>{t.classes.tier}</label>
                  <Select value={watch('tier')} onValueChange={v => { if (v) setValue('tier', v, { shouldValidate: true }) }}>
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>{TIERS.map(tier => <SelectItem key={tier} value={tier}>{tier}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.tier && <p className="text-xs text-red-500">{errors.tier.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>{t.classes.class_label}</label>
                  <Select value={watch('branch')} onValueChange={v => { if (v) setValue('branch', v, { shouldValidate: true }) }}>
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>{CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.branch && <p className="text-xs text-red-500">{errors.branch.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>{t.classes.day}</label>
                    <Select value={watch('schedule_day') ?? ''} onValueChange={v => setValue('schedule_day', v ?? undefined)}>
                      <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:ring-0">
                        <SelectValue placeholder={t.classes.day_placeholder} />
                      </SelectTrigger>
                      <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>{t.classes.time}</label>
                    <input type="time" {...register('schedule_time')} className={inputClass} />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                    style={{ background: '#1E8449' }}>
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t.classes.save_changes}
                  </button>
                  {!confirmDelete ? (
                    <button type="button" onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                      <Trash2 className="w-4 h-4" /> {t.classes.delete}
                    </button>
                  ) : (
                    <button type="button" onClick={handleDelete}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors">
                      <AlertTriangle className="w-4 h-4" /> {t.classes.confirm_delete}
                    </button>
                  )}
                </div>
                {confirmDelete && (
                  <p className="text-xs text-red-500">
                    {t.classes.delete_warning}
                  </p>
                )}
              </form>
            ) : loadingRoster ? (
              <div className="py-10 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" />
              </div>
            ) : (
              <div className="space-y-5 pt-1">
                {/* Current roster */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    {t.classes.current_roster} ({roster.length})
                  </p>
                  {roster.length === 0 ? (
                    <p className="text-xs text-gray-400 py-3">{t.classes.no_enrolled}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {roster.map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: color }}>
                            {initials(s.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                            <p className="text-xs text-gray-400">{s.branch}</p>
                          </div>
                          <button onClick={() => removeStudent(s.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                            {t.common.remove}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add students */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                    {t.classes.add_students}
                  </p>
                  {available.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">
                      {t.classes.no_available} <span className="font-semibold">{cls.tier}</span>.{' '}
                      {t.classes.no_available_hint}
                    </p>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        {available.map(s => {
                          const sel = selectedIds.has(s.id)
                          return (
                            <button key={s.id} onClick={() => toggleAvailable(s.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                                sel ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                              }`}>
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ backgroundColor: sel ? '#1E8449' : '#9CA3AF' }}>
                                {sel ? <Check className="w-4 h-4" /> : initials(s.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                                <p className="text-xs text-gray-400">{s.branch}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                      {selectedIds.size > 0 && (
                        <button onClick={addSelected} disabled={addingStudents}
                          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                          style={{ background: '#1E8449' }}>
                          {addingStudents && <Loader2 className="w-4 h-4 animate-spin" />}
                          <Users className="w-4 h-4" />
                          {t.common.add} {selectedIds.size} {selectedIds.size !== 1 ? t.classes.student_plural : t.classes.student_singular}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
