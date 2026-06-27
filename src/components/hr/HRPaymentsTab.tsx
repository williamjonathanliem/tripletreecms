'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CreditCard, Download, Search, ChevronDown, ChevronUp, AlertCircle, TrendingUp, MessageCircle } from 'lucide-react'
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

function StudentFeeRow({ student, hrName }: { student: HRStudent; hrName: string }) {
  const supabase = createClient()
  const [status, setStatus] = useState<FeeStatus>(student.fee_status ?? 'unpaid')
  const [note, setNote] = useState(student.fee_note ?? '')
  const [amount, setAmount] = useState(student.fee_amount ?? '')
  const [dueDate, setDueDate] = useState(student.fee_due_date ?? '')
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const { lang } = useCmsLang()
  const p = CMS_T[lang].payments

  const meta = STATUS_META[status]
  const overdue = isOverdue({ ...student, fee_status: status, fee_due_date: dueDate || student.fee_due_date })

  async function save() {
    setSaving(true)
    const updatePayload: Record<string, unknown> = {
      fee_status: status,
      fee_note: note.trim() || null,
      fee_due_date: dueDate || null,
    }
    // Only include fee_amount if the column exists (after migration)
    if (amount) updatePayload.fee_amount = amount.trim() || null

    const { error } = await supabase
      .from('students')
      .update(updatePayload)
      .eq('id', student.id)
    setSaving(false)
    if (error) { toast.error(p.failed_update); return }
    toast.success(`${student.name} — ${p.updated_success}`)
    setExpanded(false)
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

  return (
    <div className={`border rounded-2xl overflow-hidden bg-white transition-all ${
      overdue ? 'border-red-200' : 'border-gray-100'
    }`}>
      {overdue && <div className="h-0.5 w-full bg-red-400" />}
      {/* Main row */}
      <div className="flex items-center gap-4 px-5 py-3.5">
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

          {/* Due date */}
          <div className="flex gap-2 items-center">
            <label className="text-xs font-semibold text-gray-500 w-20 shrink-0">{p.due_date_label}</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:border-gray-400 transition-colors" />
            {dueDate && (
              <button onClick={() => setDueDate('')} className="text-xs text-gray-400 hover:text-gray-600">{p.clear}</button>
            )}
          </div>

          {/* Note */}
          <input type="text" value={note} onChange={e => setNote(e.target.value)}
            placeholder={p.note_placeholder}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300" />

          {/* Receipt section */}
          {(status === 'paid' || status === 'partial') && (
            <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{p.receipt_section}</p>
              <div className="flex gap-2 items-center">
                <div className="relative w-36 shrink-0">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-semibold">RM</span>
                  <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300" />
                </div>
                <button onClick={handleDownload} disabled={downloading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white disabled:opacity-60 transition-colors"
                  style={{ background: '#1A5276' }}>
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {p.receipt_btn}
                </button>
              </div>
            </div>
          )}

          {/* Save / Cancel */}
          <div className="flex gap-2">
            <button onClick={() => setExpanded(false)}
              className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors">
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
              style={{ background: '#1A5276' }}>
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function HRPaymentsTab({ students, hrName }: { students: HRStudent[]; hrName: string }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FeeStatus | 'all'>('all')
  const [showOverdueOnly, setShowOverdueOnly] = useState(false)
  const { lang } = useCmsLang()
  const p = CMS_T[lang].payments

  const today = new Date()
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const overdueStudents = students.filter(s => isOverdue(s))
  const paidThisMonth = students.filter(s =>
    s.fee_status === 'paid' &&
    s.fee_due_date?.startsWith(thisMonth)
  )

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
      {/* Monthly snapshot */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">
            {today.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })} {p.monthly_overview}
          </h3>
        </div>
        <div className="grid grid-cols-3 divide-x divide-gray-50">
          <div className="px-5 py-4">
            <p className="text-2xl font-bold text-[#1E8449]">{paidThisMonth.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">{p.paid_this_month}</p>
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
