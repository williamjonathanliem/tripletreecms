'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CreditCard, Download, Search, ChevronDown, ChevronUp, AlertCircle, TrendingUp, MessageCircle, Mail, X, CheckCircle2, UserPlus } from 'lucide-react'
import { downloadReceipt } from '@/components/students/FeeReceiptPDF'
import type { Subject } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

type FeeStatus = 'paid' | 'unpaid' | 'partial'

export type HRStudent = {
  id: string
  name: string
  age: number
  tier: string
  branch: string
  subject: Subject
  fee_status: FeeStatus | null
  fee_note: string | null
  fee_amount: string | null
  fee_due_date: string | null
  enrolled_date: string
  teacher_name: string
  teacher_id: string
  parent_contact: string | null
  parent_email: string | null
}

const STATUS_META: Record<FeeStatus, { label: string; color: string; bg: string; border: string }> = {
  paid:    { label: 'Paid',    color: '#1E8449', bg: '#EAFAF1', border: '#1E8449' },
  unpaid:  { label: 'Unpaid',  color: '#CB4335', bg: '#FDEDEC', border: '#CB4335' },
  partial: { label: 'Partial', color: '#B7770D', bg: '#FEF9E7', border: '#B7770D' },
}

const ALL_STATUSES: FeeStatus[] = ['paid', 'unpaid', 'partial']

function toWhatsApp(phone: string, message: string) {
  const digits = phone.replace(/\D/g, '')
  const intl = digits.startsWith('60') ? digits : `60${digits.replace(/^0/, '')}`
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`
}

function isOverdue(student: HRStudent): boolean {
  if (!student.fee_due_date) return false
  if (student.fee_status === 'paid') return false
  return new Date(student.fee_due_date) < new Date(new Date().toDateString())
}

function quickDateStr(offsetMonths: number, endOfMonth = false): string {
  const d = new Date()
  d.setMonth(d.getMonth() + offsetMonths)
  if (endOfMonth) d.setDate(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())
  return d.toISOString().slice(0, 10)
}

function StudentFeeRow({ student, hrName }: { student: HRStudent; hrName: string }) {
  const supabase = createClient()
  const [status, setStatus] = useState<FeeStatus>(student.fee_status ?? 'unpaid')
  const [note, setNote] = useState(student.fee_note ?? '')
  const [amount, setAmount] = useState(student.fee_amount ?? '')
  const [dueDate, setDueDate] = useState(student.fee_due_date ?? '')
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const { lang } = useCmsLang()
  const p = CMS_T[lang].payments

  const meta = STATUS_META[status]
  const overdue = isOverdue({ ...student, fee_status: status, fee_due_date: dueDate || student.fee_due_date })

  const isDirty =
    status !== (student.fee_status ?? 'unpaid') ||
    amount !== (student.fee_amount ?? '') ||
    dueDate !== (student.fee_due_date ?? '') ||
    note !== (student.fee_note ?? '')

  async function save() {
    setSaving(true)
    const prevStatus = student.fee_status ?? 'unpaid'
    const { error } = await supabase
      .from('students')
      .update({
        fee_status: status,
        fee_note: note.trim() || null,
        fee_due_date: dueDate || null,
        fee_amount: amount.trim() || null,
      })
      .eq('id', student.id)
    setSaving(false)
    if (error) { toast.error(p.failed_update); return }
    toast.success(`${student.name} — ${p.updated_success}`)

    // Auto-send parent portal invite when first marked as paid
    if (status === 'paid' && prevStatus !== 'paid' && student.parent_email) {
      sendInvite(student.parent_email)
    }

    setExpanded(false)
  }

  async function sendInvite(email?: string) {
    const target = email ?? student.parent_email
    if (!target) { toast.error('No parent email on file'); return }
    setInviting(true)
    try {
      const res = await fetch('/api/invite-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id, email: target }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Could not send invite'); return }
      if (json.method === 'existing') {
        toast.success('Parent already has an account — they can log in directly')
      } else {
        toast.success(`Parent portal invite sent to ${target}`)
      }
      setInviteSent(true)
    } catch {
      toast.error('Invite failed — check SMTP settings')
    } finally {
      setInviting(false)
    }
  }

  async function handleDownload() {
    if (status === 'unpaid') return
    setDownloading(true)
    const receiptNumber = `TT-${Date.now().toString().slice(-6)}`
    const receiptDate = new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
    await downloadReceipt({
      studentName: student.name,
      tier: student.tier,
      branch: student.branch,
      subject: student.subject,
      status: status as 'paid' | 'partial',
      note: note || null,
      amount,
      teacherName: hrName,
      receiptDate,
      receiptNumber,
    })
    setDownloading(false)
  }

  const amountLabel = status === 'unpaid' ? p.amount_owed : p.amount_paid

  return (
    <div className={`border rounded-2xl overflow-hidden bg-white transition-all ${
      overdue ? 'border-red-200' : isDirty && expanded ? 'border-amber-300' : 'border-gray-100'
    }`}>
      {overdue && <div className="h-0.5 w-full bg-red-400" />}

      {/* Main row */}
      <div className="flex items-center gap-3 px-5 py-3.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-gray-900 truncate">{student.name}</p>
            {overdue && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full shrink-0">
                <AlertCircle className="w-3 h-3" /> {p.overdue_badge}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {student.subject} · {student.tier !== student.subject ? `${student.tier} · ` : ''}{student.branch} · {student.teacher_name}
          </p>
          {dueDate && status !== 'paid' && (
            <p className="text-xs mt-0.5" style={{ color: overdue ? '#DC2626' : '#6B7280' }}>
              {p.due_prefix} {new Date(dueDate + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Amount chip — visible without expanding */}
        {amount && (
          <span className="text-xs font-bold shrink-0" style={{ color: meta.color }}>
            RM {parseFloat(amount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}

        <span className="text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0"
          style={{ color: meta.color, background: meta.bg, borderColor: meta.border + '40' }}>
          {meta.label}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {student.parent_contact && (
            <a href={toWhatsApp(student.parent_contact, p.wa_message.replace('{name}', student.name))}
              target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-gray-400 hover:text-green-700 hover:bg-green-50 transition-colors"
              title="WhatsApp parent">
              <MessageCircle className="w-4 h-4" />
            </a>
          )}
          {(status === 'paid' || status === 'partial') && !expanded && (
            <button onClick={handleDownload} disabled={downloading}
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#1A5276] hover:bg-blue-50 transition-colors disabled:opacity-50"
              title="Download receipt">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>
          )}
          <button onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-gray-50 px-5 py-4 bg-gray-50 space-y-3">
          {/* Status buttons */}
          <div className="flex gap-2">
            {ALL_STATUSES.map(s => {
              const m = STATUS_META[s]
              const active = status === s
              return (
                <button key={s} onClick={() => setStatus(s)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
                  style={active
                    ? { background: m.bg, color: m.color, borderColor: m.border }
                    : { background: 'white', color: '#9CA3AF', borderColor: '#E5E7EB' }
                  }>
                  {m.label}
                </button>
              )
            })}
          </div>

          {/* Amount — always visible */}
          <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{amountLabel}</p>
              {(status === 'paid' || status === 'partial') && (
                <button onClick={handleDownload} disabled={downloading || !amount}
                  className="flex items-center gap-1 text-xs font-semibold disabled:opacity-40 transition-colors"
                  style={{ color: '#1A5276' }}
                  title={!amount ? 'Enter an amount first' : 'Download receipt'}>
                  {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                  {p.receipt_btn}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">RM</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                onKeyDown={e => { if (e.key === '-') e.preventDefault() }}
                placeholder="0.00"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800 focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300 placeholder:font-normal"
              />
            </div>
            {amount && (
              <p className="text-xs text-gray-400 text-right">
                {parseFloat(amount).toLocaleString('en-MY', { style: 'currency', currency: 'MYR' })}
              </p>
            )}
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500">{p.due_date_label}</label>
            <div className="flex gap-2 items-center">
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" />
              {dueDate && (
                <button onClick={() => setDueDate('')} className="text-xs text-gray-400 hover:text-gray-600 shrink-0">{p.clear}</button>
              )}
            </div>
            {/* Quick-pick shortcuts */}
            <div className="flex gap-1.5 flex-wrap">
              {[
                { label: p.end_of_month,  value: quickDateStr(0, true) },
                { label: p.plus_1_month,  value: quickDateStr(1, true) },
                { label: p.plus_2_months, value: quickDateStr(2, true) },
                { label: p.plus_3_months, value: quickDateStr(3, true) },
              ].map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setDueDate(opt.value)}
                  className="text-[10px] font-semibold px-2 py-1 rounded-lg border transition-colors"
                  style={dueDate === opt.value
                    ? { background: '#EBF5FB', color: '#1A5276', borderColor: '#AED6F1' }
                    : { background: 'white', color: '#9CA3AF', borderColor: '#E5E7EB' }
                  }>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder={p.note_placeholder}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300" />

          {/* Parent portal invite */}
          {student.parent_email && (
            <button
              onClick={() => sendInvite()}
              disabled={inviting}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all"
              style={inviteSent
                ? { background: '#EAFAF1', color: '#1E8449', borderColor: '#A9DFBF' }
                : { background: 'white', color: '#1A5276', borderColor: '#AED6F1' }
              }
            >
              {inviting
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <UserPlus className="w-3.5 h-3.5" />
              }
              {inviteSent ? 'Invite sent ✓' : `Send parent portal invite → ${student.parent_email}`}
            </button>
          )}

          {/* Save / Cancel */}
          <div className="flex gap-2">
            <button onClick={() => setExpanded(false)}
              className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors">
              {CMS_T[lang].common.cancel}
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60 relative"
              style={{ background: isDirty ? '#1A5276' : '#1E8449' }}>
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              {isDirty ? p.save_changes : CMS_T[lang].common.save}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const DEFAULT_SUBJECT = 'Fee Payment Reminder — {{student}}'
const DEFAULT_BODY = `Dear Parent,

We hope {{student}} is enjoying their classes at Triple Tree Enrichment Centre.

This is a friendly reminder that the tuition fee for {{student}}'s {{subject}} class is due {{due_date}}. The outstanding amount is {{amount}}.

Please contact our admin to process payment at your earliest convenience.

You may reach us via:
• WhatsApp: [your WhatsApp number]
• Email: [your email]

Thank you for your continued support.

Warm regards,
Triple Tree Enrichment Centre`

function FeeReminderModal({ students, onClose }: { students: HRStudent[]; onClose: () => void }) {
  const { lang } = useCmsLang()
  const p = CMS_T[lang].payments
  const unpaid = students.filter(s => (s.fee_status ?? 'unpaid') !== 'paid' && s.parent_email)
  const [selected, setSelected] = useState<Set<string>>(new Set(unpaid.map(s => s.id)))
  const [templateSubject, setTemplateSubject] = useState(
    () => localStorage.getItem('fee_reminder_subject') ?? DEFAULT_SUBJECT
  )
  const [templateBody, setTemplateBody] = useState(
    () => localStorage.getItem('fee_reminder_body') ?? DEFAULT_BODY
  )
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; errors: { email: string; reason: string }[] } | null>(null)

  function toggleAll() {
    if (selected.size === unpaid.length) setSelected(new Set())
    else setSelected(new Set(unpaid.map(s => s.id)))
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function send() {
    if (selected.size === 0) { toast.error(p.select_at_least_one); return }
    setSending(true)
    try {
      const res = await fetch('/api/send-fee-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: Array.from(selected), templateSubject, templateBody }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Failed to send'); return }
      setResult(json)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-bold text-gray-900 text-sm">{p.reminder_title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{unpaid.length} {p.reminder_subtitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {result ? (
          /* Result screen */
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-[#1E8449]" />
            </div>
            <p className="font-bold text-gray-900">{result.sent} {p.sent_success}</p>
            {result.errors.length > 0 && (
              <div className="w-full bg-red-50 border border-red-100 rounded-xl p-4 text-xs text-red-700 space-y-1">
                <p className="font-semibold mb-1">{p.failed_label} ({result.errors.length}):</p>
                {result.errors.map(e => <p key={e.email}>{e.email} — {e.reason}</p>)}
              </div>
            )}
            <button onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800">
              {p.done}
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-5">
              {/* Recipient list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{p.recipients}</p>
                  <button onClick={toggleAll} className="text-xs text-[#1A5276] font-semibold hover:underline">
                    {selected.size === unpaid.length ? p.deselect_all : p.select_all}
                  </button>
                </div>
                {unpaid.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">{p.no_unpaid_email}</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {unpaid.map(s => (
                      <label key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)}
                          className="accent-[#1E8449] w-4 h-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                          <p className="text-xs text-gray-400 truncate">{s.parent_email ?? '—'}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          s.fee_status === 'partial' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                        }`}>{s.fee_status === 'partial' ? CMS_T[lang].students.fee_partial : CMS_T[lang].students.fee_unpaid}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Template */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{p.email_template}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateSubject(DEFAULT_SUBJECT)
                      setTemplateBody(DEFAULT_BODY)
                      localStorage.removeItem('fee_reminder_subject')
                      localStorage.removeItem('fee_reminder_body')
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline"
                  >
                    {p.reset_template}
                  </button>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-xs text-amber-700 space-y-0.5">
                  <p className="font-semibold">{p.placeholders_hint}</p>
                  <p><code className="bg-amber-100 px-1 rounded">{'{{student}}'}</code> {lang === 'zh' ? '学生姓名' : 'Student name'} &nbsp;·&nbsp; <code className="bg-amber-100 px-1 rounded">{'{{amount}}'}</code> {lang === 'zh' ? '学费金额' : 'Fee amount'} &nbsp;·&nbsp; <code className="bg-amber-100 px-1 rounded">{'{{due_date}}'}</code> {lang === 'zh' ? '到期日' : 'Due date'} &nbsp;·&nbsp; <code className="bg-amber-100 px-1 rounded">{'{{subject}}'}</code> {lang === 'zh' ? '科目' : 'Subject'} &nbsp;·&nbsp; <code className="bg-amber-100 px-1 rounded">{'{{note}}'}</code> {lang === 'zh' ? '学费备注' : 'Fee note'}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">{p.subject_line}</label>
                  <input
                    type="text"
                    value={templateSubject}
                    onChange={e => { setTemplateSubject(e.target.value); localStorage.setItem('fee_reminder_subject', e.target.value) }}
                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-600">{p.body_label}</label>
                  <textarea
                    rows={10}
                    value={templateBody}
                    onChange={e => { setTemplateBody(e.target.value); localStorage.setItem('fee_reminder_body', e.target.value) }}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:border-gray-400 resize-none font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {!result && (
          <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
            <button onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              {CMS_T[lang].common.cancel}
            </button>
            <button onClick={send} disabled={sending || selected.size === 0}
              className="flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: '#1E8449' }}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {sending ? p.sending : `${p.send_to} ${selected.size} ${p.reminder_subtitle}`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function HRPaymentsTab({ students, hrName }: { students: HRStudent[]; hrName: string }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FeeStatus | 'all'>('all')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const { lang } = useCmsLang()
  const p = CMS_T[lang].payments

  const today = new Date()
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const overdueStudents = students.filter(s => isOverdue(s))
  const paidThisMonth = students.filter(s =>
    s.fee_status === 'paid' &&
    s.fee_due_date?.startsWith(thisMonth)
  )
  const totalCollectedThisMonth = paidThisMonth.reduce((sum, s) => {
    const n = parseFloat(s.fee_amount ?? '')
    return sum + (isNaN(n) ? 0 : n)
  }, 0)

  const filtered = students.filter(s => {
    if (showOverdueOnly && !isOverdue(s)) return false
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.tier.toLowerCase().includes(search.toLowerCase()) ||
      s.teacher_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || (s.fee_status ?? 'unpaid') === statusFilter
    return matchSearch && matchStatus
  })

  const counts = {
    all:     students.length,
    paid:    students.filter(s => (s.fee_status ?? 'unpaid') === 'paid').length,
    unpaid:  students.filter(s => (s.fee_status ?? 'unpaid') === 'unpaid').length,
    partial: students.filter(s => (s.fee_status ?? 'unpaid') === 'partial').length,
  }

  return (
    <div className="space-y-4">
      {showReminder && <FeeReminderModal students={students} onClose={() => setShowReminder(false)} />}

      {/* Monthly snapshot */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">
              {today.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })} {p.monthly_overview}
            </h3>
          </div>
          <button
            onClick={() => setShowReminder(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shrink-0"
            style={{ background: '#1E8449' }}>
            <Mail className="w-3.5 h-3.5" />
            {p.send_reminders}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-50">
          <div className="px-5 py-4">
            <p className="text-2xl font-bold text-[#1E8449]">{paidThisMonth.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">{p.paid_this_month}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-xl font-bold text-[#1E8449] leading-tight">
              {totalCollectedThisMonth > 0
                ? `RM ${totalCollectedThisMonth.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{p.collected}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-2xl font-bold text-[#CB4335]">{overdueStudents.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">{p.overdue_label}</p>
          </div>
          <div className="px-5 py-4">
            <p className="text-2xl font-bold text-gray-900">
              {students.filter(s => !s.fee_due_date && s.fee_status !== 'paid').length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{p.no_due_date}</p>
          </div>
        </div>
        {overdueStudents.length > 0 && (
          <div className="px-5 py-3 bg-red-50 border-t border-red-100">
            <button onClick={() => setShowOverdueOnly(v => !v)}
              className="flex items-center gap-2 text-xs font-semibold text-red-700">
              <AlertCircle className="w-3.5 h-3.5" />
              {showOverdueOnly ? p.show_all : `${p.overdue_label}: ${overdueStudents.length}`}
            </button>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {([
          { key: 'all',     label: 'All Students', color: '#6B7280', bg: '#F9FAFB' },
          { key: 'paid',    label: 'Paid',         color: '#1E8449', bg: '#EAFAF1' },
          { key: 'unpaid',  label: 'Unpaid',       color: '#CB4335', bg: '#FDEDEC' },
          { key: 'partial', label: 'Partial',      color: '#B7770D', bg: '#FEF9E7' },
        ] as const).map(({ key, label, color, bg }) => (
          <button key={key} onClick={() => { setStatusFilter(key); setShowOverdueOnly(false) }}
            className="rounded-2xl p-4 text-left transition-all border-2"
            style={{ background: bg, borderColor: statusFilter === key && !showOverdueOnly ? color : 'transparent' }}>
            <p className="text-2xl font-bold" style={{ color }}>{counts[key]}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder={p.search_placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gray-400 transition-colors" />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">{p.no_students}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Overdue first */}
          {filtered.sort((a, b) => {
            const aOver = isOverdue(a) ? 1 : 0
            const bOver = isOverdue(b) ? 1 : 0
            return bOver - aOver || a.name.localeCompare(b.name)
          }).map(s => (
            <StudentFeeRow key={s.id} student={s} hrName={hrName} />
          ))}
        </div>
      )}
    </div>
  )
}
