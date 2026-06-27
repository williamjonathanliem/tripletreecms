'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2, CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { TIERS, SUBJECTS, SUBJECT_META, type Subject } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

function blank() {
  return {
    name: '',
    age: '',
    subject: 'coding' as Subject,
    tier: '',
    trial_date: new Date().toISOString().split('T')[0],
    trial_time: '',
    parent_name: '',
    parent_contact: '',
    notes: '',
    add_to_calendar: false,
  }
}

export function AddTrialDialog() {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [open, setOpen] = useState(false)
  const [fields, setFields] = useState(blank())
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function set(key: string, value: any) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  function handleClose(v: boolean) {
    setOpen(v)
    if (!v) { setFields(blank()); setErrors({}) }
  }

  const isCoding = fields.subject === 'coding'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errs: Record<string, string> = {}
    if (!fields.name.trim()) errs.name = t.trial.error_name
    const ageNum = Number(fields.age)
    if (!fields.age || isNaN(ageNum) || ageNum < 4 || ageNum > 18) errs.age = t.trial.error_age
    if (isCoding && !fields.tier) errs.tier = t.trial.error_tier
    if (!fields.trial_date) errs.trial_date = t.trial.error_trial_date
    if (fields.add_to_calendar && !fields.trial_time) errs.trial_time = t.trial.error_trial_time

    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    const resolvedTier = isCoding ? fields.tier : SUBJECT_META[fields.subject].label

    const { error } = await supabase.from('trial_students').insert({
      name: fields.name.trim(),
      age: ageNum,
      subject: fields.subject,
      tier: resolvedTier,
      trial_date: fields.trial_date,
      parent_name: fields.parent_name || null,
      parent_contact: fields.parent_contact || null,
      notes: fields.notes || null,
      teacher_id: user.id,
      outcome: 'pending',
    })

    if (error) {
      toast.error('Failed to add trial student')
      setSubmitting(false)
      return
    }

    // Optionally create a calendar event for this trial
    if (fields.add_to_calendar && fields.trial_time) {
      const [h, m] = fields.trial_time.split(':').map(Number)
      const endH = Math.min(h + 1, 21)
      const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      await supabase.from('schedule_events').insert({
        title: `Trial: ${fields.name.trim()}`,
        subject: fields.subject,
        event_date: fields.trial_date,
        start_time: fields.trial_time,
        end_time: endTime,
        event_type: 'trial',
        description: `Age ${ageNum} · ${fields.tier}${fields.notes ? ` · ${fields.notes}` : ''}`,
        created_by: user.id,
      })
      // RLS silently denies for non-HR — visible on schedule after HR approves
    }

    toast.success('Trial student added')
    setFields(blank())
    setOpen(false)
    setSubmitting(false)
    router.refresh()
  }

  const subjectMeta = SUBJECT_META[fields.subject]

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-[#1E8449] hover:bg-[#196F3D]">
        <Plus className="w-4 h-4 mr-2" />{t.trial.add_trial_btn}
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.trial.add_trial_title}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">

            {/* Name */}
            <div className="space-y-1.5">
              <Label>{t.trial.student_name}</Label>
              <Input value={fields.name} onChange={e => set('name', e.target.value)} placeholder={t.trial.name_placeholder} />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Age */}
              <div className="space-y-1.5">
                <Label>{t.trial.age}</Label>
                <Input type="number" value={fields.age} onChange={e => set('age', e.target.value)} placeholder={t.trial.age_placeholder} min={4} max={18} />
                {errors.age && <p className="text-xs text-red-500">{errors.age}</p>}
              </div>

              {/* Trial date */}
              <div className="space-y-1.5">
                <Label>{t.trial.trial_date}</Label>
                <Input type="date" value={fields.trial_date} onChange={e => set('trial_date', e.target.value)} />
                {errors.trial_date && <p className="text-xs text-red-500">{errors.trial_date}</p>}
              </div>
            </div>

            {/* Subject chips */}
            <div className="space-y-1.5">
              <Label>{t.trial.subject}</Label>
              <div className="flex gap-1.5 flex-wrap">
                {SUBJECTS.map(s => {
                  const m = SUBJECT_META[s]
                  const sel = fields.subject === s
                  return (
                    <button key={s} type="button" onClick={() => set('subject', s)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                      style={sel
                        ? { color: m.color, background: m.bg, borderColor: m.color }
                        : { color: '#9CA3AF', borderColor: '#E5E7EB', background: 'white' }}>
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Trial class tier — coding only */}
            {isCoding && (
              <div className="space-y-1.5">
                <Label>{t.trial.trial_class}</Label>
                <Select value={fields.tier} onValueChange={v => { if (v) set('tier', v) }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.trial.tier_placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map(tier => <SelectItem key={tier} value={tier}>{tier}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.tier && <p className="text-xs text-red-500">{errors.tier}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{t.trial.parent_guardian}</Label>
                <Input value={fields.parent_name} onChange={e => set('parent_name', e.target.value)} placeholder={t.trial.name_placeholder} />
              </div>
              <div className="space-y-1.5">
                <Label>{t.trial.contact}</Label>
                <Input value={fields.parent_contact} onChange={e => set('parent_contact', e.target.value)} placeholder={t.trial.contact_placeholder} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t.trial.notes}</Label>
              <Textarea value={fields.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder={t.trial.notes_placeholder} className="resize-none" />
            </div>

            {/* Calendar section */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50/50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.add_to_calendar}
                  onChange={e => set('add_to_calendar', e.target.checked)}
                  className="w-4 h-4 rounded accent-[#1E8449]"
                />
                <CalendarPlus className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">{t.trial.add_to_calendar}</span>
              </label>

              {fields.add_to_calendar && (
                <div className="pl-7 space-y-1.5">
                  <Label>{t.trial.trial_time}</Label>
                  <Input type="time" value={fields.trial_time} onChange={e => set('trial_time', e.target.value)} className="w-36" />
                  {errors.trial_time && <p className="text-xs text-red-500">{errors.trial_time}</p>}
                  <p className="text-xs text-gray-400">
                    Creates a <span style={{ color: subjectMeta.color }}>{subjectMeta.label}</span> trial event on {fields.trial_date || 'the selected date'}.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={submitting} className="bg-[#1E8449] hover:bg-[#196F3D]">
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                {t.trial.submit_btn}
              </Button>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>{t.trial.cancel}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
