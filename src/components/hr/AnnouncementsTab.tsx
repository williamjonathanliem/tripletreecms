'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2, Megaphone } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Announcement } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function NewAnnouncementDialog({ onCreated }: { onCreated: () => void }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function submit() {
    if (!title.trim() || !body.trim()) { toast.error('Title and message are required'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('announcements').insert({
      title: title.trim(),
      body: body.trim(),
      created_by: user?.id ?? null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    })
    setSaving(false)
    if (error) { toast.error('Failed to post announcement'); return }
    toast.success('Announcement posted to all staff')
    setOpen(false)
    setTitle('')
    setBody('')
    setExpiresAt('')
    onCreated()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#1A5276' }}
      >
        <Plus className="w-4 h-4" /> {t.hr_announcements.new_btn}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t.hr_announcements.post_title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <p className="text-xs text-gray-500">{t.hr_announcements.banner_hint}</p>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.hr_announcements.title_label}</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t.hr_announcements.title_placeholder} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t.hr_announcements.message_label}</Label>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={t.hr_announcements.message_placeholder}
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t.hr_announcements.expires_label} <span className="text-gray-400 normal-case font-normal">({t.hr_announcements.expires_hint})</span>
              </Label>
              <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                {t.hr_announcements.cancel}
              </button>
              <button onClick={submit} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: '#1A5276' }}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t.hr_announcements.post_btn}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function AnnouncementsTab({ announcements: initial }: { announcements: Announcement[] }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [announcements, setAnnouncements] = useState(initial)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function deleteAnnouncement(id: string) {
    setDeleting(id)
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    setDeleting(null)
    if (error) { toast.error('Failed to delete'); return }
    setAnnouncements(prev => prev.filter(a => a.id !== id))
    toast.success('Announcement removed')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {announcements.length} {announcements.length !== 1 ? t.hr_announcements.active_plural : t.hr_announcements.active_singular}
        </p>
        <NewAnnouncementDialog onCreated={() => router.refresh()} />
      </div>

      {announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <Megaphone className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">{t.hr_announcements.no_announcements}</p>
          <p className="text-xs text-gray-300 mt-1">{t.hr_announcements.no_announcements_hint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#FEF3C7' }}>
                  <Megaphone className="w-4 h-4" style={{ color: '#D97706' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{a.title}</p>
                  <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{a.body}</p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="text-xs text-gray-400">{t.hr_announcements.posted_at} {formatDate(a.created_at)}</span>
                    {a.expires_at && (
                      <span className="text-xs text-amber-600">{t.hr_announcements.expires_at} {formatDate(a.expires_at)}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteAnnouncement(a.id)}
                  disabled={deleting === a.id}
                  className="shrink-0 p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deleting === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
