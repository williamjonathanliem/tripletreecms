'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Send, Loader2, Mail, Users, Clock, User } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'

type HistoryRow = {
  id: string
  created_at: string
  title: string
  body: string
  sender_name: string | null
  sent_count: number
  errors: number
}

export function ParentAnnouncementsTab() {
  const [title,      setTitle]      = useState('')
  const [body,       setBody]       = useState('')
  const [senderName, setSenderName] = useState('')
  const [sending,    setSending]    = useState(false)
  const [history,    setHistory]    = useState<HistoryRow[]>([])
  const [loadingHx,  setLoadingHx]  = useState(true)

  const canSend = title.trim().length > 0 && body.trim().length > 0

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    const supabase = createClient()
    const { data } = await supabase
      .from('parent_notices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setHistory((data ?? []) as HistoryRow[])
    setLoadingHx(false)
  }

  async function handleSend() {
    if (!canSend) return
    setSending(true)
    try {
      const res = await fetch('/api/send-announcement-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:        title.trim(),
          body:         body.trim(),
          senderName:   senderName.trim() || undefined,
          sendToStaff:  false,
          sendToParents: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to send')
        return
      }

      // Persist to DB
      const supabase = createClient()
      await supabase.from('parent_notices').insert({
        title:       title.trim(),
        body:        body.trim(),
        sender_name: senderName.trim() || null,
        sent_count:  json.parentsSent,
        errors:      json.errors?.length ?? 0,
      })

      toast.success(`Sent to ${json.parentsSent} parent${json.parentsSent !== 1 ? 's' : ''}`)
      if (json.errors?.length) toast.error(`${json.errors.length} failed to deliver`)

      setTitle('')
      setBody('')
      setSenderName('')
      loadHistory()
    } catch {
      toast.error('Could not send — check SMTP settings')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Compose */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#1E8449]" />
          <p className="text-sm font-semibold text-gray-900">New Parent Notice</p>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-400">
            Sends an email to all parents who have a parent email address on file.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              From (sender name)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                placeholder="e.g. Ms Kim · Triple Tree"
                className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Shown as the sender name in the email header. Defaults to &ldquo;Triple Tree Enrichment Centre&rdquo;.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Subject</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. School Holiday Notice — Centre Closed"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message</label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Dear parents, we would like to inform you that…"
              rows={6}
              className="resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Users className="w-3.5 h-3.5" />
              Sent to all parents with email on file
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !canSend}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: canSend ? '#1E8449' : '#9CA3AF' }}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending…' : 'Send to Parents'}
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Send History</p>
          <span className="text-xs text-gray-400">{history.length} notice{history.length !== 1 ? 's' : ''}</span>
        </div>
        {loadingHx ? (
          <div className="px-5 py-8 flex items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : history.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No notices sent yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map(h => (
              <div key={h.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{h.title}</p>
                    {h.sender_name && (
                      <p className="text-xs text-gray-500 mt-0.5">From: {h.sender_name}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{h.body}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-[#1E8449]">{h.sent_count} sent</span>
                    {h.errors > 0 && (
                      <p className="text-[10px] text-red-400 mt-0.5">{h.errors} failed</p>
                    )}
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(h.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' '}
                      {new Date(h.created_at).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
