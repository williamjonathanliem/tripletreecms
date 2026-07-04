'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { TrialStudent } from '@/types'
import { TIER_COLORS, SUBJECT_META } from '@/types'
import { Phone, User, UserCheck, UserX, Loader2, Users, CalendarDays, Bell, BellOff, MessageCircle } from 'lucide-react'
import { CURRICULUM } from '@/lib/curriculum'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function toWhatsApp(phone: string, studentName: string) {
  const digits = phone.replace(/\D/g, '')
  const intl = digits.startsWith('60') ? digits : `60${digits.replace(/^0/, '')}`
  const msg = encodeURIComponent(`Hi, I'm contacting regarding ${studentName}'s trial class at Triple Tree Coding.`)
  return `https://wa.me/${intl}?text=${msg}`
}

type ClassOption = { id: string; tier: string; branch: string; subject: string }

function EnrollModal({
  trial, onClose, onEnrolled,
}: {
  trial: TrialStudent; onClose: () => void; onEnrolled: () => void
}) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [classes, setClasses] = useState<ClassOption[]>([])
  const [classId, setClassId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useState(() => {
    supabase
      .from('classes')
      .select('id, tier, branch, subject')
      .eq('tier', trial.tier)
      .order('branch')
      .then(({ data, error }) => {
        if (error) setLoadError(true)
        else setClasses(data ?? [])
        setLoading(false)
      })
  })

  async function doEnroll() {
    setSaving(true)

    const chosenClass = classId ? classes.find(c => c.id === classId) : null
    const branch = chosenClass?.branch ?? 'TBD'

    // FIX: preserve trial.teacher_id — don't use current user.id
    const { data: student, error } = await supabase.from('students').insert({
      teacher_id: trial.teacher_id,
      name: trial.name,
      age: trial.age,
      subject: trial.subject ?? 'coding',
      tier: trial.tier,
      branch,
      module_current: 0,
      module_total: CURRICULUM[trial.tier]?.length ?? 1,
      enrolled_date: new Date().toISOString().split('T')[0],
      parent_contact: trial.parent_contact,
      parent_email: trial.parent_email ?? null,
      notes: trial.notes,
      fee_status: 'unpaid',
    }).select().single()

    if (error || !student) {
      toast.error('Failed to enroll student')
      setSaving(false)
      return
    }

    if (classId && student) {
      await supabase.from('class_students').insert({ class_id: classId, student_id: student.id })
    }

    await supabase.from('trial_students').update({ outcome: 'converting' }).eq('id', trial.id)
    toast.success(`${trial.name} enrolled${chosenClass ? ` into ${chosenClass.branch}` : ''}`)
    setSaving(false)
    onEnrolled()
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.trial.enroll_btn} {trial.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: TIER_COLORS[trial.tier] ?? '#6B7280' }}>
              {getInitials(trial.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{trial.name}</p>
              <p className="text-xs text-gray-400">{trial.tier} · {t.trial.age_label} {trial.age}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {t.trial.assign_class_label} <span className="text-gray-400 normal-case font-normal">({t.trial.assign_class_optional})</span>
            </label>
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t.trial.loading_classes}
              </div>
            ) : loadError ? (
              <p className="text-xs text-red-400 py-2">Failed to load classes. Student will be added without a class.</p>
            ) : classes.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">{t.trial.no_classes_for_tier} {trial.tier}. Student will be added without a class.</p>
            ) : (
              <Select value={classId} onValueChange={v => setClassId(v === '__none__' ? '' : (v ?? ''))}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:ring-0">
                  <SelectValue placeholder={t.trial.skip_add_later} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t.trial.skip_add_later}</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
              {t.trial.cancel}
            </button>
            <button onClick={doEnroll} disabled={saving || loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: '#1E8449' }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {t.trial.enroll_modal_btn}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TrialCard({ trial }: { trial: TrialStudent }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const OUTCOME_BADGE: Record<string, { label: string; bg: string; color: string }> = {
    pending:    { label: t.trial.pending,    bg: '#FEF9E7', color: '#B7770D' },
    converting: { label: t.trial.enroll_btn, bg: '#EAFAF1', color: '#1E8449' },
    dropped:    { label: t.trial.drop_btn,   bg: '#FDEDEC', color: '#CB4335' },
  }

  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<'drop' | 'followup' | null>(null)
  const [followUp, setFollowUp] = useState(trial.follow_up ?? false)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [confirmDrop, setConfirmDrop] = useState(false)

  const color = TIER_COLORS[trial.tier] || SUBJECT_META[trial.subject]?.color || '#B7770D'
  const badge = OUTCOME_BADGE[trial.outcome] ?? OUTCOME_BADGE.pending

  async function toggleFollowUp() {
    setLoading('followup')
    const next = !followUp
    const { error } = await supabase.from('trial_students').update({ follow_up: next }).eq('id', trial.id)
    setLoading(null)
    if (error) { toast.error('Failed to update'); return }
    setFollowUp(next)
    toast.success(next ? 'Follow-up flag set' : 'Follow-up cleared')
  }

  async function handleDrop() {
    setLoading('drop')
    await supabase.from('trial_students').update({ outcome: 'dropped' }).eq('id', trial.id)
    toast.success(`${trial.name} marked as dropped`)
    setLoading(null)
    setConfirmDrop(false)
    router.refresh()
  }

  return (
    <>
      {enrollOpen && (
        <EnrollModal
          trial={trial}
          onClose={() => setEnrollOpen(false)}
          onEnrolled={() => { setEnrollOpen(false); router.refresh() }}
        />
      )}
      <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-colors ${
        followUp ? 'border-amber-200' : 'border-gray-100'
      }`}>
        <div className="h-1 w-full" style={{ background: followUp ? '#F59E0B' : color }} />

        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            {/* Avatar + Info */}
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: color }}>
                {getInitials(trial.name)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-bold text-gray-900">{trial.name}</p>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                  {followUp && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                      {t.trial.follow_up_badge}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 items-center">
                  <span>{t.trial.age_label} {trial.age}</span>
                  {trial.subject && (
                    <span className="font-semibold px-2 py-0.5 rounded-full text-[11px]"
                      style={{ color: SUBJECT_META[trial.subject]?.color, background: SUBJECT_META[trial.subject]?.bg }}>
                      {SUBJECT_META[trial.subject]?.label}
                    </span>
                  )}
                  <span className="font-semibold" style={{ color }}>{trial.tier}</span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> {trial.trial_date}
                  </span>
                </div>

                {/* Parent info */}
                {(trial.parent_name || trial.parent_contact) && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 items-center">
                    {trial.parent_name && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <User className="w-3 h-3" /> {trial.parent_name}
                      </span>
                    )}
                    {trial.parent_contact && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {trial.parent_contact}
                      </span>
                    )}
                    {trial.parent_contact && (
                      <a href={toWhatsApp(trial.parent_contact, trial.name)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </a>
                    )}
                  </div>
                )}

                {trial.notes && (
                  <p className="text-xs text-gray-400 italic mt-1.5">{trial.notes}</p>
                )}
              </div>
            </div>

            {/* Actions — row on mobile, column on sm+ */}
            <div className="flex sm:flex-col gap-2 sm:shrink-0 flex-wrap">
              {trial.outcome === 'pending' && (
                <>
                  <button onClick={() => setEnrollOpen(true)}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors"
                    style={{ background: '#1E8449' }}>
                    <UserCheck className="w-3.5 h-3.5" /> {t.trial.enroll_btn}
                  </button>
                  {!confirmDrop ? (
                    <button onClick={() => setConfirmDrop(true)}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                      style={{ background: '#FDEDEC', color: '#CB4335' }}>
                      <UserX className="w-3.5 h-3.5" /> {t.trial.drop_btn}
                    </button>
                  ) : (
                    <button onClick={handleDrop} disabled={loading === 'drop'}
                      className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white transition-colors disabled:opacity-60">
                      {loading === 'drop' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                      Confirm
                    </button>
                  )}
                </>
              )}
              <button onClick={toggleFollowUp} disabled={loading === 'followup'}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-60 ${
                  followUp ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {loading === 'followup'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : followUp ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                {followUp ? t.trial.clear_btn : t.trial.follow_up_btn}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export function TrialStudentList({ trials }: { trials: TrialStudent[] }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const pending = trials.filter(t => t.outcome === 'pending')
  const followUpNeeded = pending.filter(t => t.follow_up)
  const regularPending = pending.filter(t => !t.follow_up)
  const past = trials.filter(t => t.outcome !== 'pending')

  if (trials.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
        <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">{t.trial.no_trials}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {followUpNeeded.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">
              {t.trial.follow_up_needed} ({followUpNeeded.length})
            </p>
          </div>
          {followUpNeeded.map(trial => <TrialCard key={trial.id} trial={trial} />)}
        </div>
      )}
      {regularPending.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {t.trial.pending} ({regularPending.length})
          </p>
          {regularPending.map(trial => <TrialCard key={trial.id} trial={trial} />)}
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            {t.trial.past_trials} ({past.length})
          </p>
          {past.map(trial => <TrialCard key={trial.id} trial={trial} />)}
        </div>
      )}
    </div>
  )
}
