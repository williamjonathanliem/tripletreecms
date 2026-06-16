'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { TrialStudent } from '@/types'
import { TIER_COLORS } from '@/types'
import { Phone, User, UserCheck, UserX, Loader2, Users, CalendarDays } from 'lucide-react'
import { CURRICULUM } from '@/lib/curriculum'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const OUTCOME_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  pending:    { label: 'Pending',    bg: '#FEF9E7', color: '#B7770D' },
  converting: { label: 'Enrolled',   bg: '#EAFAF1', color: '#1E8449' },
  dropped:    { label: 'Dropped',    bg: '#FDEDEC', color: '#CB4335' },
}

function TrialCard({ trial }: { trial: TrialStudent }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<'enroll' | 'drop' | null>(null)

  const color = TIER_COLORS[trial.tier] || '#B7770D'
  const badge = OUTCOME_BADGE[trial.outcome] ?? OUTCOME_BADGE.pending

  async function handleEnroll() {
    setLoading('enroll')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('students').insert({
      teacher_id: user.id,
      name: trial.name,
      age: trial.age,
      tier: trial.tier,
      branch: 'TBD',
      module_current: 0,
      module_total: CURRICULUM[trial.tier]?.length ?? 1,
      enrolled_date: new Date().toISOString().split('T')[0],
      parent_contact: trial.parent_contact,
      notes: trial.notes,
    })
    if (error) { toast.error('Failed to enroll student'); setLoading(null); return }
    await supabase.from('trial_students').update({ outcome: 'converting' }).eq('id', trial.id)
    toast.success(`${trial.name} enrolled as student`)
    setLoading(null)
    router.refresh()
  }

  async function handleDrop() {
    setLoading('drop')
    await supabase.from('trial_students').update({ outcome: 'dropped' }).eq('id', trial.id)
    toast.success(`${trial.name} marked as dropped`)
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Tier color top bar */}
      <div className="h-1 w-full" style={{ background: color }} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: color }}
          >
            {getInitials(trial.name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-bold text-gray-900">{trial.name}</p>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: badge.bg, color: badge.color }}
              >
                {badge.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>Age {trial.age}</span>
              <span
                className="font-semibold"
                style={{ color }}
              >
                {trial.tier}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" /> {trial.trial_date}
              </span>
            </div>

            {/* Parent info */}
            {(trial.parent_name || trial.parent_contact) && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
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
              </div>
            )}

            {trial.notes && (
              <p className="text-xs text-gray-400 italic mt-1.5">{trial.notes}</p>
            )}
          </div>

          {/* Actions */}
          {trial.outcome === 'pending' && (
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={handleEnroll}
                disabled={!!loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors disabled:opacity-60"
                style={{ background: '#1E8449' }}
              >
                {loading === 'enroll'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <UserCheck className="w-3.5 h-3.5" />}
                Enroll
              </button>
              <button
                onClick={handleDrop}
                disabled={!!loading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                style={{ background: '#FDEDEC', color: '#CB4335' }}
              >
                {loading === 'drop'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <UserX className="w-3.5 h-3.5" />}
                Drop
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function TrialStudentList({ trials }: { trials: TrialStudent[] }) {
  const pending = trials.filter(t => t.outcome === 'pending')
  const past    = trials.filter(t => t.outcome !== 'pending')

  if (trials.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
        <Users className="w-8 h-8 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No trial students yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Pending ({pending.length})
          </p>
          {pending.map(t => <TrialCard key={t.id} trial={t} />)}
        </div>
      )}
      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Past Trials ({past.length})
          </p>
          {past.map(t => <TrialCard key={t.id} trial={t} />)}
        </div>
      )}
    </div>
  )
}
