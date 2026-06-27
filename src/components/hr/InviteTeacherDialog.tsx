'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SUBJECTS, SUBJECT_META, type Subject } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

const inputClass = "w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1A5276] focus:bg-white transition-colors"
const labelClass = "text-xs font-semibold uppercase tracking-wide text-gray-500"

interface Props {
  onInvited: () => void
}

export function InviteTeacherDialog({ onInvited }: Props) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'teacher' | 'hr'>('teacher')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)

  function toggleSubject(s: Subject) {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function reset() {
    setName(''); setEmail(''); setRole('teacher'); setSubjects([]); setLoading(false)
  }

  function handleClose(v: boolean) { setOpen(v); if (!v) reset() }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { toast.error('Name and email are required'); return }
    if (subjects.length === 0) { toast.error('Assign at least one subject'); return }
    setLoading(true)

    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), role, subjects }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) { toast.error(json.error ?? 'Invite failed'); return }
    toast.success(`Invite sent to ${email}`)
    handleClose(false)
    onInvited()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#1A5276' }}
      >
        <Plus className="w-4 h-4" /> {t.hr_invite.invite_btn}
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{t.hr_invite.dialog_title}</DialogTitle></DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className={labelClass}>{t.hr_invite.full_name}</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder={t.hr_invite.name_placeholder} className={inputClass} />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>{t.hr_invite.email}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.hr_invite.email_placeholder} className={inputClass} />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>{t.hr_invite.role}</label>
              <div className="flex gap-2">
                {(['teacher', 'hr'] as const).map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      role === r ? 'border-[#1A5276] bg-[#E6F1FB] text-[#1A5276]' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    {r === 'teacher' ? t.hr_invite.role_teacher : t.hr_invite.role_hr}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>{t.hr_invite.subjects}</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map(s => {
                  const meta = SUBJECT_META[s]
                  const sel = subjects.includes(s)
                  return (
                    <button key={s} type="button" onClick={() => toggleSubject(s)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        sel ? 'border-transparent' : 'border-gray-200 bg-gray-50 text-gray-500'
                      }`}
                      style={sel ? { color: meta.color, background: meta.bg, borderColor: meta.color } : undefined}>
                      {sel && <X className="w-3 h-3" />}
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: '#1A5276' }}>
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.hr_invite.send_invite}
              </button>
              <button type="button" onClick={() => handleClose(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                {t.hr_invite.cancel}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
