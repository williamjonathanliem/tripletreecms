'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Send, Loader2, Mail, Users, Clock, User, Search } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

type HistoryRow = {
  id: string
  created_at: string
  title: string
  body: string
  sender_name: string | null
  sent_count: number
  errors: number
}

type ParentEntry = {
  email: string
  names: string[]  // student names linked to this email
}

export function ParentAnnouncementsTab() {
  const { lang } = useCmsLang()
  const t = CMS_T[lang].hr_parent_notices

  const [title,        setTitle]        = useState('')
  const [body,         setBody]         = useState('')
  const [senderName,   setSenderName]   = useState('')
  const [sending,      setSending]      = useState(false)
  const [history,      setHistory]      = useState<HistoryRow[]>([])
  const [loadingHx,    setLoadingHx]    = useState(true)

  // Recipients
  const [allParents,     setAllParents]     = useState<ParentEntry[]>([])
  const [loadingParents, setLoadingParents] = useState(true)
  const [filterAll,      setFilterAll]      = useState(true)   // true = all, false = specific
  const [selected,       setSelected]       = useState<Set<string>>(new Set())
  const [parentSearch,   setParentSearch]   = useState('')

  const canSend = title.trim().length > 0 && body.trim().length > 0 && (filterAll ? allParents.length > 0 : selected.size > 0)

  useEffect(() => {
    loadHistory()
    loadParents()
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

  async function loadParents() {
    const supabase = createClient()
    const { data } = await supabase
      .from('students')
      .select('name, parent_email')
      .not('parent_email', 'is', null)
      .order('name')

    const map = new Map<string, string[]>()
    for (const s of data ?? []) {
      if (!s.parent_email) continue
      if (!map.has(s.parent_email)) map.set(s.parent_email, [])
      map.get(s.parent_email)!.push(s.name)
    }
    const entries = Array.from(map.entries()).map(([email, names]) => ({ email, names }))
    setAllParents(entries)
    setSelected(new Set(entries.map(e => e.email)))
    setLoadingParents(false)
  }

  function toggleParent(email: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(email)) next.delete(email); else next.add(email)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === allParents.length) setSelected(new Set())
    else setSelected(new Set(allParents.map(p => p.email)))
  }

  const filteredParents = allParents.filter(p =>
    p.email.toLowerCase().includes(parentSearch.toLowerCase()) ||
    p.names.some(n => n.toLowerCase().includes(parentSearch.toLowerCase()))
  )

  async function handleSend() {
    if (!canSend) return
    setSending(true)
    try {
      const targetEmails = filterAll ? undefined : Array.from(selected)
      const res = await fetch('/api/send-announcement-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          title:         title.trim(),
          body:          body.trim(),
          senderName:    senderName.trim() || undefined,
          sendToStaff:   false,
          sendToParents: true,
          parentEmails:  targetEmails,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? t.toast_error)
        return
      }

      const supabase = createClient()
      await supabase.from('parent_notices').insert({
        title:       title.trim(),
        body:        body.trim(),
        sender_name: senderName.trim() || null,
        sent_count:  json.parentsSent ?? 0,
        errors:      json.errors?.length ?? 0,
      })

      if ((json.parentsSent ?? 0) > 0) {
        const count = json.parentsSent
        toast.success(`${t.toast_sent} ${count} ${count !== 1 ? t.toast_parents : t.toast_parent}`)
      }
      if (json.errors?.length) {
        toast.error(`${json.errors.length} ${t.toast_failed}`)
      }

      setTitle('')
      setBody('')
      setSenderName('')
      setFilterAll(true)
      loadHistory()
    } catch {
      toast.error(t.toast_error)
    } finally {
      setSending(false)
    }
  }

  const recipientCount = filterAll ? allParents.length : selected.size

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Compose */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#1E8449]" />
          <p className="text-sm font-semibold text-gray-900">{t.card_title}</p>
        </div>
        <div className="p-5 space-y-4">

          {/* Sender name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t.from_label}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                placeholder={t.from_placeholder}
                className="w-full h-11 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{t.from_hint}</p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t.subject_label}</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t.subject_placeholder}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t.message_label}</label>
            <Textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={t.message_placeholder}
              rows={6}
              className="resize-none"
            />
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t.recipients_label}</label>

            {/* Segmented control */}
            <div className="flex rounded-xl bg-gray-100 p-1 gap-1 mb-3">
              <button
                onClick={() => setFilterAll(true)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={filterAll
                  ? { background: 'white', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
                  : { background: 'transparent', color: '#9CA3AF' }}
              >
                {t.all_parents}
                {!loadingParents && <span className="ml-1 font-normal opacity-60">({allParents.length})</span>}
              </button>
              <button
                onClick={() => setFilterAll(false)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={!filterAll
                  ? { background: 'white', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
                  : { background: 'transparent', color: '#9CA3AF' }}
              >
                {t.pick_specific}
                {!filterAll && <span className="ml-1 font-normal opacity-60">({selected.size})</span>}
              </button>
            </div>

            {/* Specific parent picker */}
            {!filterAll && (
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                {/* Search */}
                <div className="px-3 py-2.5 bg-white border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none" />
                    <input
                      type="text"
                      value={parentSearch}
                      onChange={e => setParentSearch(e.target.value)}
                      placeholder={t.search_placeholder}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 bg-gray-50 focus:outline-none focus:border-gray-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Select all row */}
                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <button onClick={toggleAll} className="text-[11px] font-semibold text-[#1A5276] hover:underline">
                    {selected.size === allParents.length ? t.deselect_all : t.select_all}
                  </button>
                  <span className="text-[11px] text-gray-400">
                    {selected.size} {t.selected_of} {allParents.length} {t.selected_suffix}
                  </span>
                </div>

                {/* List */}
                <div className="max-h-44 overflow-y-auto bg-white divide-y divide-gray-50">
                  {loadingParents ? (
                    <div className="py-6 flex justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
                    </div>
                  ) : filteredParents.length === 0 ? (
                    <p className="py-4 text-center text-xs text-gray-400">{t.no_parents}</p>
                  ) : filteredParents.map(p => (
                    <label key={p.email} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={selected.has(p.email)}
                        onChange={() => toggleParent(p.email)}
                        className="accent-[#1E8449] w-3.5 h-3.5 shrink-0 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 truncate">{p.email}</p>
                        <p className="text-[11px] text-gray-400 truncate">{p.names.join(', ')}</p>
                      </div>
                      {selected.has(p.email) && (
                        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[#1E8449]" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Send button */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Users className="w-3.5 h-3.5" />
              {loadingParents ? t.loading : `${recipientCount} ${recipientCount !== 1 ? t.recipient_plural : t.recipient_singular}`}
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !canSend}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: canSend ? '#1E8449' : '#9CA3AF' }}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? t.sending : t.send_btn}
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t.history_title}</p>
          <span className="text-xs text-gray-400">{history.length} {history.length !== 1 ? t.notice_plural : t.notice_singular}</span>
        </div>
        {loadingHx ? (
          <div className="px-5 py-8 flex items-center justify-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> {t.loading}
          </div>
        ) : history.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">{t.no_history}</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {history.map(h => (
              <div key={h.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{h.title}</p>
                    {h.sender_name && <p className="text-xs text-gray-500 mt-0.5">{t.from_prefix} {h.sender_name}</p>}
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{h.body}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-[#1E8449]">{h.sent_count} {t.sent_label}</span>
                    {h.errors > 0 && <p className="text-[10px] text-red-400 mt-0.5">{h.errors} {t.failed_label}</p>}
                    <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(h.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}
                      {' · '}
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
