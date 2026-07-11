'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Loader2, CreditCard, Download } from 'lucide-react'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'
import { downloadReceipt } from './FeeReceiptPDF'

type FeeStatus = 'paid' | 'unpaid' | 'partial'

export function FeeStatusCard({
  studentId,
  initialStatus,
  initialNote,
  studentName,
  tier,
  branch,
  subject,
  teacherName,
  readOnly = false,
}: {
  studentId: string
  initialStatus: FeeStatus | null
  initialNote: string | null
  studentName?: string
  tier?: string
  branch?: string
  subject?: string
  teacherName?: string
  readOnly?: boolean
}) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const STATUS_META: Record<FeeStatus, { label: string; color: string; bg: string; border: string }> = {
    paid:    { label: t.students.fee_paid,    color: '#1E8449', bg: '#EAFAF1', border: '#1E8449' },
    unpaid:  { label: t.students.fee_unpaid,  color: '#CB4335', bg: '#FDEDEC', border: '#CB4335' },
    partial: { label: t.students.fee_partial, color: '#B7770D', bg: '#FEF9E7', border: '#B7770D' },
  }

  const [status, setStatus] = useState<FeeStatus>(initialStatus ?? 'unpaid')
  const [note, setNote] = useState(initialNote ?? '')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const supabase = createClient()

  const meta = STATUS_META[status]

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('students')
      .update({ fee_status: status, fee_note: note.trim() || null })
      .eq('id', studentId)
    setSaving(false)
    if (error) { toast.error('Failed to save fee status'); return }
    toast.success('Fee status updated')
    setEditing(false)
  }

  async function handleDownload() {
    if (status === 'unpaid') return
    setDownloading(true)
    try {
      const { data: receiptNoData } = await supabase.rpc('next_receipt_number')
      const receiptNumber = (receiptNoData as string) ?? `TTE/${new Date().getFullYear()}/????`
      const receiptDate = new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
      const servicePeriod = new Date().toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })

      await supabase.from('payment_receipts').insert({
        receipt_no:     receiptNumber,
        student_id:     studentId,
        student_name:   studentName ?? 'Student',
        subject:        subject ?? null,
        tier:           tier ?? null,
        branch:         branch ?? null,
        amount:         null,
        fee_status:     status,
        payment_method: 'Cash',
        service_period: servicePeriod,
        note:           note || null,
        issued_by:      teacherName ?? null,
        issued_date:    new Date().toISOString().slice(0, 10),
      })

      await downloadReceipt({
        studentName: studentName ?? 'Student',
        tier: tier ?? '—',
        branch: branch ?? '—',
        subject: subject ?? '—',
        status: status as 'paid' | 'partial',
        note: note || null,
        amount: '',
        paymentMethod: 'Cash',
        servicePeriod,
        teacherName: teacherName ?? 'Teacher',
        receiptDate,
        receiptNumber,
      })
    } finally {
      setDownloading(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
            <CreditCard className="w-4 h-4" style={{ color: meta.color }} />
          </div>
          <div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{ color: meta.color, background: meta.bg, borderColor: meta.border + '40' }}>
              {meta.label}
            </span>
            {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {(status === 'paid' || status === 'partial') && (
            <button onClick={handleDownload} disabled={downloading}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#1A5276] transition-colors px-2.5 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-50">
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Receipt
            </button>
          )}
          {!readOnly && (
            <button onClick={() => setEditing(true)}
              className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-gray-100">
              {t.common.edit}
            </button>
          )}
          {readOnly && (
            <span className="text-xs text-gray-300 px-2.5 py-1.5">HR manages</span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(Object.keys(STATUS_META) as FeeStatus[]).map(s => {
          const m = STATUS_META[s]
          const active = status === s
          return (
            <button key={s} onClick={() => setStatus(s)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-all"
              style={active
                ? { background: m.bg, color: m.color, borderColor: m.border }
                : { background: '#F9FAFB', color: '#9CA3AF', borderColor: '#E5E7EB' }
              }>
              {m.label}
            </button>
          )
        })}
      </div>
      <input
        type="text"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder={t.students.fee_note_placeholder}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-700 focus:outline-none focus:border-gray-400 transition-colors placeholder:text-gray-300"
      />
      <div className="flex gap-2">
        <button onClick={() => setEditing(false)}
          className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          {t.common.cancel}
        </button>
        <button onClick={save} disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60"
          style={{ background: '#1A5276' }}>
          {saving && <Loader2 className="w-3 h-3 animate-spin" />}
          {t.common.save}
        </button>
      </div>
    </div>
  )
}
