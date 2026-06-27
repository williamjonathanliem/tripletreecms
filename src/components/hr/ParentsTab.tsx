'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Users, Mail, RefreshCw, Loader2, Trash2, ShieldOff, ShieldCheck,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, UserX, Clock,
} from 'lucide-react'
import type { ParentAccount } from '@/app/api/manage-parent/route'

const STATUS_CFG = {
  active:     { label: 'Active',      color: '#1E8449', bg: '#EAF3DE', icon: CheckCircle2 },
  banned:     { label: 'Deactivated', color: '#b45309', bg: '#FEF3C7', icon: ShieldOff    },
  no_account: { label: 'No Account',  color: '#6B7280', bg: '#F3F4F6', icon: UserX        },
}

type Action = 'deactivate' | 'reactivate' | 'delete' | 'resend' | 'update-email' | null

export function ParentsTab() {
  const [accounts, setAccounts] = useState<ParentAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null) // email being actioned
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [editEmail, setEditEmail] = useState<{ email: string; value: string } | null>(null)
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/manage-parent')
      if (!res.ok) throw new Error('Failed to load')
      setAccounts(await res.json())
    } catch {
      toast.error('Could not load parent accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function doAction(action: Action, account: ParentAccount, extra?: Record<string, string>) {
    if (!action) return
    setBusy(account.email)
    try {
      const res = await fetch('/api/manage-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          email: account.email,
          userId: account.userId,
          ...extra,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Action failed'); return }

      const messages: Record<string, string> = {
        deactivate:    'Account deactivated — parent can no longer log in.',
        reactivate:    'Account reactivated.',
        delete:        'Parent account deleted and unlinked from all students.',
        resend:        'Invite / login link sent.',
        'update-email': 'Email updated successfully.',
      }
      toast.success(messages[action] ?? 'Done')
      await load()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setBusy(null)
      setConfirmDelete(null)
      setEditEmail(null)
    }
  }

  const filtered = accounts.filter(a =>
    a.email.toLowerCase().includes(search.toLowerCase()) ||
    a.students.some(s => s.name.toLowerCase().includes(search.toLowerCase()))
  )

  const counts = {
    active: accounts.filter(a => a.status === 'active').length,
    banned: accounts.filter(a => a.status === 'banned').length,
    no_account: accounts.filter(a => a.status === 'no_account').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading parent accounts…</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {([
          ['active',     'Active',      '#1E8449', '#EAF3DE'],
          ['banned',     'Deactivated', '#b45309', '#FEF3C7'],
          ['no_account', 'No Account',  '#6B7280', '#F3F4F6'],
        ] as const).map(([key, label, color, bg]) => (
          <div key={key} className="rounded-xl border px-4 py-3 flex items-center gap-3"
            style={{ background: bg, borderColor: `${color}33` }}>
            <span className="text-2xl font-bold" style={{ color }}>{counts[key]}</span>
            <span className="text-sm font-medium" style={{ color }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Search + refresh */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by email or student name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 h-10 px-3 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-gray-400"
        />
        <button onClick={load}
          className="h-10 w-10 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (() => {
        const acct = accounts.find(a => a.email === confirmDelete)!
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Delete parent account?</p>
                  <p className="text-xs text-gray-500 mt-1">
                    This will permanently delete the auth account for <span className="font-medium text-gray-700">{acct.email}</span> and
                    unlink them from {acct.students.length} student{acct.students.length !== 1 ? 's' : ''}.
                    The student records are not deleted.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 h-9 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => doAction('delete', acct)}
                  disabled={busy === acct.email}
                  className="flex-1 h-9 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
                  {busy === acct.email ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Edit email modal */}
      {editEmail && (() => {
        const acct = accounts.find(a => a.email === editEmail.email)!
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
              <p className="font-semibold text-gray-900 text-sm">Edit Parent Email</p>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Current: <span className="font-medium text-gray-700">{acct.email}</span></p>
                <input
                  type="email"
                  placeholder="New email address"
                  value={editEmail.value}
                  onChange={e => setEditEmail(v => v ? { ...v, value: e.target.value } : v)}
                  className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 outline-none focus:border-gray-400"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditEmail(null)}
                  className="flex-1 h-9 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={() => doAction('update-email', acct, { newEmail: editEmail.value })}
                  disabled={busy === acct.email || !editEmail.value.trim()}
                  className="flex-1 h-9 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
                  {busy === acct.email ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Accounts list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Users className="w-8 h-8" />
          <p className="text-sm">{accounts.length === 0 ? 'No parent emails linked to any students yet.' : 'No results match your search.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(acct => {
            const cfg = STATUS_CFG[acct.status]
            const StatusIcon = cfg.icon
            const isOpen = expanded === acct.email
            const isBusy = busy === acct.email

            return (
              <div key={acct.email}
                className="border border-gray-100 rounded-xl bg-white overflow-hidden shadow-sm">
                {/* Row header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Status dot */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: cfg.bg }}>
                    <StatusIcon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>

                  {/* Email + students */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{acct.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {acct.students.length} student{acct.students.length !== 1 ? 's' : ''}: {acct.students.map(s => s.name).join(', ')}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}>
                    {cfg.label}
                  </span>

                  {/* Last seen */}
                  {acct.lastSignIn && (
                    <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                      <Clock className="w-3 h-3" />
                      {new Date(acct.lastSignIn).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </div>
                  )}

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : acct.email)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Expanded panel */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-3">
                    {/* Linked students */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Linked Students</p>
                      <div className="flex flex-wrap gap-2">
                        {acct.students.map(s => (
                          <div key={s.id} className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                            <span className="font-medium text-gray-800">{s.name}</span>
                            <span className="text-gray-400">·</span>
                            <span className="text-gray-500">{s.tier}</span>
                            <span className="text-gray-400">·</span>
                            <span className="text-gray-500">{s.branch}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {/* Resend invite / magic link */}
                      <button
                        onClick={() => doAction('resend', acct)}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                        {acct.status === 'no_account' ? 'Send Invite' : 'Resend Login Link'}
                      </button>

                      {/* Edit email */}
                      <button
                        onClick={() => setEditEmail({ email: acct.email, value: '' })}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50">
                        <Mail className="w-3.5 h-3.5" />
                        Edit Email
                      </button>

                      {/* Deactivate / Reactivate */}
                      {acct.status === 'active' && (
                        <button
                          onClick={() => doAction('deactivate', acct)}
                          disabled={isBusy}
                          className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50">
                          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                          Deactivate
                        </button>
                      )}
                      {acct.status === 'banned' && (
                        <button
                          onClick={() => doAction('reactivate', acct)}
                          disabled={isBusy}
                          className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50">
                          {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          Reactivate
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => setConfirmDelete(acct.email)}
                        disabled={isBusy}
                        className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 ml-auto">
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
