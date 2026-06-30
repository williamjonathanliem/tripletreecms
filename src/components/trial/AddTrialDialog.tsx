'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2, CalendarPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { TIERS, SUBJECTS, SUBJECT_META, type Subject } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

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

function blank() {
  return {
    name:           '',
    age:            '',
    subject:        'coding' as Subject,
    tier:           '',
    trial_date:     new Date().toISOString().split('T')[0],
    trial_time:     '',
    parent_name:    '',
    parent_contact: '',
    notes:          '',
    add_to_calendar: false,
  }
}

function getInitials(name: string) {
  return name.trim().split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

export function AddTrialDialog() {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [open,       setOpen]       = useState(false)
  const [fields,     setFields]     = useState(blank())
  const [submitting, setSubmitting] = useState(false)
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const router    = useRouter()
  const supabase  = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function set(key: string, value: any) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  function handleClose(v: boolean) {
    setOpen(v)
    if (!v) { setFields(blank()); setErrors({}) }
  }

  const isCoding    = fields.subject === 'coding'
  const subjectMeta = SUBJECT_META[fields.subject]
  const accentColor = subjectMeta?.color ?? '#1A5276'

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

    const resolvedTier = isCoding ? fields.tier : subjectMeta.label

    const { error } = await supabase.from('trial_students').insert({
      name:           fields.name.trim(),
      age:            ageNum,
      subject:        fields.subject,
      tier:           resolvedTier,
      trial_date:     fields.trial_date,
      parent_name:    fields.parent_name || null,
      parent_contact: fields.parent_contact || null,
      notes:          fields.notes || null,
      teacher_id:     user.id,
      outcome:        'pending',
    })

    if (error) {
      toast.error('Failed to add trial student')
      setSubmitting(false)
      return
    }

    if (fields.add_to_calendar && fields.trial_time) {
      const [h, m] = fields.trial_time.split(':').map(Number)
      const endH   = Math.min(h + 1, 21)
      const endTime = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      await supabase.from('schedule_events').insert({
        title:       `Trial: ${fields.name.trim()}`,
        subject:     fields.subject,
        event_date:  fields.trial_date,
        start_time:  fields.trial_time,
        end_time:    endTime,
        event_type:  'trial',
        description: `Age ${ageNum} · ${resolvedTier}${fields.notes ? ` · ${fields.notes}` : ''}`,
        created_by:  user.id,
      })
    }

    toast.success('Trial student added')
    setFields(blank())
    setOpen(false)
    setSubmitting(false)
    router.refresh()
  }

  const inp    = "w-full h-10 px-3 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all"
  const inpErr = "ring-2 ring-red-200 border-red-200"
  const label  = "text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2 block"

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-[#1E8449] hover:bg-[#196F3D]">
        <Plus className="w-4 h-4 mr-2" />{t.trial.add_trial_btn}
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl max-h-[92vh] flex flex-col">

          {/* ── Rich header ──────────────────────────────────────────────── */}
          <div className="flex items-center gap-4 p-5 pb-4 border-b border-gray-100 shrink-0">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 transition-colors"
              style={{ backgroundColor: accentColor }}
            >
              {getInitials(fields.name)}
            </div>
            <div className="flex-1 min-w-0">
              <input
                className="w-full text-lg font-bold text-gray-900 bg-transparent border-b-2 border-gray-200 focus:border-gray-900 focus:outline-none pb-1 placeholder:text-gray-300 transition-colors"
                placeholder={t.trial.name_placeholder}
                value={fields.name}
                onChange={e => set('name', e.target.value)}
              />
              {errors.name
                ? <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                : <p className="text-xs text-gray-400 mt-1">{t.trial.student_name}</p>
              }
            </div>
            <button type="button" onClick={() => handleClose(false)}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* ── Scrollable body ──────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Subject grid */}
              <div>
                <p className={label}>{t.trial.subject}</p>
                <div className="grid grid-cols-4 gap-2">
                  {SUBJECTS.map(s => {
                    const m      = SUBJECT_META[s]
                    const active = fields.subject === s
                    const shortLabel = m.label
                      .replace('& Robotics', '')
                      .replace('(Extra)', 'Extra')
                      .trim()
                    return (
                      <button key={s} type="button" onClick={() => set('subject', s)}
                        className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-center transition-all hover:scale-[1.02]"
                        style={active
                          ? { background: m.bg, borderColor: m.color }
                          : { background: '#F9FAFB', borderColor: '#F3F4F6' }
                        }>
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

              {/* Tier — coding only */}
              {isCoding && (
                <div>
                  <p className={label}>{t.trial.trial_class}</p>
                  <Select value={fields.tier} onValueChange={v => { if (v) set('tier', v) }}>
                    <SelectTrigger className={`h-10 rounded-xl border-gray-100 bg-gray-50 ${errors.tier ? inpErr : ''}`}>
                      <SelectValue placeholder={t.trial.tier_placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {TIERS.map(tier => <SelectItem key={tier} value={tier}>{tier}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.tier && <p className="text-xs text-red-500 mt-1">{errors.tier}</p>}
                </div>
              )}

              {/* Age + Trial date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className={label}>{t.trial.age}</p>
                  <input type="number" min={4} max={18}
                    placeholder="10"
                    className={`${inp} ${errors.age ? inpErr : ''}`}
                    value={fields.age}
                    onChange={e => set('age', e.target.value)} />
                  {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
                </div>
                <div>
                  <p className={label}>{t.trial.trial_date}</p>
                  <input type="date"
                    className={`${inp} ${errors.trial_date ? inpErr : ''}`}
                    value={fields.trial_date}
                    onChange={e => set('trial_date', e.target.value)} />
                  {errors.trial_date && <p className="text-xs text-red-500 mt-1">{errors.trial_date}</p>}
                </div>
              </div>

              {/* Parent info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className={label}>{t.trial.parent_guardian}</p>
                  <input
                    placeholder={t.trial.name_placeholder}
                    className={inp}
                    value={fields.parent_name}
                    onChange={e => set('parent_name', e.target.value)} />
                </div>
                <div>
                  <p className={label}>{t.trial.contact}</p>
                  <input
                    placeholder={t.trial.contact_placeholder}
                    className={inp}
                    value={fields.parent_contact}
                    onChange={e => set('parent_contact', e.target.value)} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className={label}>{t.trial.notes}</p>
                <textarea
                  rows={2}
                  placeholder={t.trial.notes_placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none transition-all"
                  value={fields.notes}
                  onChange={e => set('notes', e.target.value)}
                />
              </div>

              {/* Add to calendar */}
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <label className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                    style={fields.add_to_calendar
                      ? { background: accentColor }
                      : { background: '#F3F4F6' }
                    }>
                    <CalendarPlus className="w-4 h-4" style={{ color: fields.add_to_calendar ? 'white' : '#9CA3AF' }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{t.trial.add_to_calendar}</p>
                    <p className="text-xs text-gray-400">Add a trial event to the schedule</p>
                  </div>
                  <div
                    className="w-10 h-6 rounded-full relative transition-colors shrink-0"
                    style={{ background: fields.add_to_calendar ? accentColor : '#E5E7EB' }}>
                    <div
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                      style={{ left: fields.add_to_calendar ? '18px' : '2px' }} />
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={fields.add_to_calendar}
                    onChange={e => set('add_to_calendar', e.target.checked)}
                  />
                </label>

                {fields.add_to_calendar && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-50 bg-gray-50/50">
                    <p className={label + ' mt-3'}>{t.trial.trial_time}</p>
                    <div className="flex items-center gap-3">
                      <input type="time"
                        className={`${inp} w-36 ${errors.trial_time ? inpErr : ''}`}
                        value={fields.trial_time}
                        onChange={e => set('trial_time', e.target.value)} />
                      <p className="text-xs text-gray-400">
                        Creates a{' '}
                        <span className="font-semibold" style={{ color: accentColor }}>
                          {subjectMeta.label}
                        </span>{' '}
                        trial on {fields.trial_date || '—'}
                      </p>
                    </div>
                    {errors.trial_time && <p className="text-xs text-red-500 mt-1">{errors.trial_time}</p>}
                  </div>
                )}
              </div>

            </div>

            {/* ── Footer actions ──────────────────────────────────────────── */}
            <div className="flex gap-2 px-5 py-4 border-t border-gray-100 shrink-0">
              <button type="button" onClick={() => handleClose(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                {t.trial.cancel}
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-opacity active:scale-[0.99]"
                style={{ background: accentColor }}>
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.trial.submit_btn}
              </button>
            </div>
          </form>

        </DialogContent>
      </Dialog>
    </>
  )
}
