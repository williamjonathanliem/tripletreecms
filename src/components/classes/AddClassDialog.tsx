'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2, ChevronRight, ChevronLeft, Check, Users } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { classSchema, type ClassInput } from '@/lib/validations'
import { TIERS, TIER_COLORS, CLASS_OPTIONS, DAYS } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

const labelClass = 'text-xs font-semibold uppercase tracking-wide text-gray-500'
const inputClass = 'w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:border-[#1E8449] focus:bg-white transition-colors'

type StudentOption = { id: string; name: string; branch: string }

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function AddClassDialog() {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [availableStudents, setAvailableStudents] = useState<StudentOption[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { register, setValue, watch, getValues, trigger, reset, handleSubmit, formState: { errors } } =
    useForm<ClassInput>({
      resolver: standardSchemaResolver(classSchema),
      defaultValues: { tier: '', branch: '', schedule_day: '', schedule_time: '09:00' },
    })

  const watchedTier = watch('tier')
  const watchedBranch = watch('branch')
  const watchedDay = watch('schedule_day')
  const watchedTime = watch('schedule_time')

  async function handleNext() {
    const valid = await trigger(['tier', 'branch'])
    if (!valid) return
    setLoadingStudents(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingStudents(false); return }
    const { data } = await supabase
      .from('students').select('id, name, branch')
      .eq('teacher_id', user.id).eq('tier', getValues('tier')).order('name')
    setAvailableStudents(data ?? [])
    setLoadingStudents(false)
    setStep(2)
  }

  async function onSubmit(data: ClassInput) {
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }
    const payload = { ...data, teacher_id: user.id }
    const { data: cls, error } = await supabase
      .from('classes').insert(payload).select().single()
    if (error || !cls) {
      toast.error(`Failed: ${error?.message ?? 'no data returned'}`)
      setSubmitting(false)
      return
    }
    if (selectedIds.size > 0) {
      await supabase.from('class_students').insert(
        Array.from(selectedIds).map(student_id => ({ class_id: cls.id, student_id }))
      )
    }
    toast.success('Class created')
    setSubmitting(false)
    handleClose(false)
    router.refresh()
  }

  function toggleStudent(id: string) {
    setSelectedIds(prev => {
      const s = new Set(prev)
      if (s.has(id)) { s.delete(id) } else { s.add(id) }
      return s
    })
  }

  async function createClassDirectly() {
    const valid = await trigger(['tier', 'branch', 'schedule_day', 'schedule_time'])
    if (!valid) return
    const data = getValues()
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }
    const payload = { ...data, teacher_id: user.id }
    const { data: cls, error } = await supabase
      .from('classes').insert(payload).select().single()
    if (error || !cls) {
      toast.error(`Failed: ${error?.message ?? 'no data returned'}`)
      setSubmitting(false)
      return
    }
    toast.success('Class created')
    setSubmitting(false)
    handleClose(false)
    router.refresh()
  }

  function handleClose(v: boolean) {
    setOpen(v)
    if (!v) { reset(); setStep(1); setSelectedIds(new Set()); setAvailableStudents([]) }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#1E8449' }}
      >
        <Plus className="w-4 h-4" /> {t.classes.add_btn}
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{step === 1 ? t.classes.add_title_step1 : t.classes.add_title_step2}</DialogTitle>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-4 pt-1">
              {/* Tier */}
              <div className="space-y-1.5">
                <label className={labelClass}>{t.classes.tier}</label>
                <Select value={watchedTier} onValueChange={v => { if (v) setValue('tier', v, { shouldValidate: true }) }}>
                  <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:ring-0">
                    <SelectValue placeholder={t.classes.tier_placeholder} />
                  </SelectTrigger>
                  <SelectContent>{TIERS.map(tier => <SelectItem key={tier} value={tier}>{tier}</SelectItem>)}</SelectContent>
                </Select>
                {errors.tier && <p className="text-xs text-red-500">{errors.tier.message}</p>}
              </div>

              {/* Class */}
              <div className="space-y-1.5">
                <label className={labelClass}>{t.classes.class_label}</label>
                <Select value={watchedBranch} onValueChange={v => { if (v) setValue('branch', v, { shouldValidate: true }) }}>
                  <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:ring-0">
                    <SelectValue placeholder={t.classes.class_placeholder} />
                  </SelectTrigger>
                  <SelectContent>{CLASS_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                {errors.branch && <p className="text-xs text-red-500">{errors.branch.message}</p>}
              </div>

              {/* Schedule */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>{t.classes.day} <span className="text-gray-400 normal-case font-normal">({t.common.optional})</span></label>
                  <Select value={watchedDay ?? ''} onValueChange={v => setValue('schedule_day', v ?? undefined)}>
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:ring-0">
                      <SelectValue placeholder={t.classes.day_placeholder} />
                    </SelectTrigger>
                    <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>{t.classes.time} <span className="text-gray-400 normal-case font-normal">({t.common.optional})</span></label>
                  <input type="time" {...register('schedule_time')} className={inputClass} />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button" onClick={handleNext} disabled={loadingStudents}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: '#1E8449' }}
                >
                  {loadingStudents ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  {t.classes.next_add_students}
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={createClassDirectly} disabled={submitting}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null}
                    {t.classes.skip_create}
                  </button>
                  <button type="button" onClick={() => handleClose(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                    {t.classes.cancel}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
              {/* Summary */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: TIER_COLORS[watchedTier] || '#6B7280' }} />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{watchedTier}</p>
                  <p className="text-xs text-gray-500">
                    {watchedBranch}{watchedDay ? ` · ${watchedDay}` : ''}{watchedTime ? ` ${watchedTime}` : ''}
                  </p>
                </div>
              </div>

              {/* Student picker */}
              {availableStudents.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{t.classes.no_students_tier}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.classes.add_later_hint}</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {availableStudents.length} {t.classes.select_to_enroll}
                    </p>
                    <button type="button" className="text-xs text-[#1E8449] font-semibold"
                      onClick={() => setSelectedIds(
                        selectedIds.size === availableStudents.length
                          ? new Set() : new Set(availableStudents.map(s => s.id))
                      )}>
                      {selectedIds.size === availableStudents.length ? t.classes.deselect_all : t.classes.select_all}
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {availableStudents.map(s => {
                      const selected = selectedIds.has(s.id)
                      return (
                        <button key={s.id} type="button" onClick={() => toggleStudent(s.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                            selected ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                          }`}>
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: selected ? '#1E8449' : '#9CA3AF' }}>
                            {selected ? <Check className="w-4 h-4" /> : initials(s.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                            <p className="text-xs text-gray-400">{s.branch}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400">{selectedIds.size} {t.classes.selected_count}</p>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                  <ChevronLeft className="w-4 h-4" /> {t.common.back}
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: '#1E8449' }}>
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t.classes.create_class}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
