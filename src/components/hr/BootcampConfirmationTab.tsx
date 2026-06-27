'use client'

import { useState } from 'react'
import { Loader2, FileDown, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import type { BootcampType, FeeType, PaymentStatus } from '@/lib/pdf/bootcamp-confirmation'

// ── Config ─────────────────────────────────────────────────────────────────

const BOOTCAMPS = {
  coding:  { label_en: 'Coding Bootcamp',  label_zh: '编程训练营',  color: '#1A5276', bg: '#EBF5FB', standard: 2600, earlyBird: 2380, ageGroups: ['6-8', '9-12'] },
  english: { label_en: 'English Bootcamp', label_zh: '英语训练营',  color: '#B7770D', bg: '#FEF9E7', standard: 2500, earlyBird: 2280, ageGroups: ['6-8', '9-12', '13+'] },
  math:    { label_en: 'Math Bootcamp',    label_zh: '数学训练营',  color: '#1E8449', bg: '#EAFAF1', standard: 2200, earlyBird: 1980, ageGroups: ['6-8', '9-12'] },
} as const

// Subject → bootcamp type mapping
const SUBJECT_TO_BOOTCAMP: Record<string, BootcampType> = {
  coding: 'coding',
  english: 'english',
  maths: 'math',
}

function getAvailableBootcamps(subjects?: string[]): BootcampType[] {
  if (!subjects || subjects.length === 0) return ['coding', 'english', 'math']
  const mapped = subjects
    .map(s => SUBJECT_TO_BOOTCAMP[s])
    .filter((b): b is BootcampType => b !== undefined)
  return mapped.length > 0 ? mapped : ['coding', 'english', 'math']
}

const TIME_SLOTS = [
  '9:00 AM – 11:00 AM',
  '9:00 AM – 11:30 AM',
  '10:00 AM – 12:00 PM',
  '10:00 AM – 12:30 PM',
  '2:00 PM – 4:00 PM',
  '2:00 PM – 4:30 PM',
  '3:00 PM – 5:00 PM',
  '3:00 PM – 5:30 PM',
]

function genConfirmationNumber() {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `TT-${year}-${rand}`
}

function addWorkingDays(startDate: string, days: number): string {
  if (!startDate) return ''
  const d = new Date(startDate)
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return d.toISOString().split('T')[0]
}

// ── UI strings ─────────────────────────────────────────────────────────────

const UI_T = {
  en: {
    bootcamp_type: 'Bootcamp Type',
    student_info: 'Student Information',
    program_details: 'Program Details',
    fee_payment: 'Fee & Payment',
    issued_by_section: 'Issued By',
    student_name: 'Student Name *',
    student_age: 'Student Age',
    age_group: 'Age Group',
    parent: 'Parent / Guardian Name',
    contact: 'Contact Number',
    email: 'Email',
    start_date: 'Start Date *',
    end_date: 'End Date (auto)',
    class_time: 'Class Time',
    fee_type: 'Fee Type',
    payment_status: 'Payment Status',
    amount_paid: 'Amount Paid (RM)',
    staff_name: 'Staff Name',
    standard: 'Standard',
    early_bird: 'Early Bird',
    fully_paid: 'Fully Paid',
    deposit_paid: 'Deposit Paid',
    pending: 'Pending',
    program_fee: 'Program Fee',
    early_bird_label: 'Early Bird',
    balance_due: 'Balance Due',
    generate: 'Generate & Download PDF',
    generating: 'Generating PDF…',
    reset: 'Reset',
    full_name_placeholder: 'Full name',
    age_placeholder: 'e.g. 10',
    parent_placeholder: 'Parent name',
    contact_placeholder: '+60 12-345 6789',
    email_placeholder: 'parent@email.com',
    custom: 'Custom…',
    custom_placeholder: 'e.g. 10:00 AM – 12:00 PM',
    deposit_placeholder: 'e.g. ',
    err_name: 'Student name is required',
    err_date: 'Start date is required',
    ok: 'Confirmation PDF downloaded',
    fail: 'Failed to generate PDF',
  },
  zh: {
    bootcamp_type: '训练营类型',
    student_info: '学生资料',
    program_details: '课程详情',
    fee_payment: '费用与付款',
    issued_by_section: '发出者',
    student_name: '学生姓名 *',
    student_age: '学生年龄',
    age_group: '年龄组',
    parent: '家长/监护人姓名',
    contact: '联系电话',
    email: '电子邮件',
    start_date: '开始日期 *',
    end_date: '结束日期（自动）',
    class_time: '上课时间',
    fee_type: '费用类型',
    payment_status: '付款状态',
    amount_paid: '已付金额（RM）',
    staff_name: '员工姓名',
    standard: '标准',
    early_bird: '早鸟优惠',
    fully_paid: '全额付清',
    deposit_paid: '已付定金',
    pending: '待付款',
    program_fee: '课程费用',
    early_bird_label: '早鸟',
    balance_due: '待付余额',
    generate: '生成并下载 PDF',
    generating: '正在生成 PDF…',
    reset: '重置',
    full_name_placeholder: '全名',
    age_placeholder: '例：10',
    parent_placeholder: '家长姓名',
    contact_placeholder: '+60 12-345 6789',
    email_placeholder: 'parent@email.com',
    custom: '自定义…',
    custom_placeholder: '例：10:00 AM – 12:00 PM',
    deposit_placeholder: '例：',
    err_name: '请填写学生姓名',
    err_date: '请填写开始日期',
    ok: '确认书 PDF 已下载',
    fail: '生成 PDF 失败',
  },
}

// ── Component ──────────────────────────────────────────────────────────────

const inputCls = "w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  )
}

interface Props {
  currentUserName?: string
  subjects?: string[]
}

export function BootcampConfirmationTab({ currentUserName, subjects }: Props) {
  const { lang } = useCmsLang()
  const t = UI_T[lang]

  const availableBootcamps = getAvailableBootcamps(subjects)
  const [bootcamp, setBootcamp] = useState<BootcampType>(availableBootcamps[0])
  const [studentName, setStudentName] = useState('')
  const [studentAge, setStudentAge] = useState('')
  const [ageGroup, setAgeGroup] = useState<string>(BOOTCAMPS[availableBootcamps[0]].ageGroups[0])
  const [parentName, setParentName] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [startDate, setStartDate] = useState('')
  const [classTime, setClassTime] = useState(TIME_SLOTS[2])
  const [customTime, setCustomTime] = useState('')
  const [feeType, setFeeType] = useState<FeeType>('standard')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid')
  const [amountPaid, setAmountPaid] = useState('')
  const [issuedBy, setIssuedBy] = useState(currentUserName ?? '')
  const [generating, setGenerating] = useState(false)

  const cfg = BOOTCAMPS[bootcamp]
  const feeAmount = feeType === 'early_bird' ? cfg.earlyBird : cfg.standard
  const endDate = startDate ? addWorkingDays(startDate, 9) : ''
  const effectiveTime = classTime === 'custom' ? customTime : classTime

  function handleBootcampChange(b: BootcampType) {
    setBootcamp(b)
    setAgeGroup(BOOTCAMPS[b].ageGroups[0])
  }

  async function handleGenerate() {
    if (!studentName.trim()) { toast.error(t.err_name); return }
    if (!startDate) { toast.error(t.err_date); return }

    setGenerating(true)
    try {
      const payload = {
        bootcamp_type: bootcamp,
        student_name: studentName.trim(),
        student_age: studentAge,
        age_group: ageGroup,
        parent_name: parentName.trim(),
        contact: contact.trim(),
        email: email.trim(),
        start_date: startDate,
        end_date: endDate,
        class_time: effectiveTime,
        fee_type: feeType,
        payment_status: paymentStatus,
        amount_paid: amountPaid || String(paymentStatus === 'paid' ? feeAmount : 0),
        confirmation_number: genConfirmationNumber(),
        issue_date: new Date().toISOString().split('T')[0],
        issued_by: issuedBy.trim() || 'Triple Tree Staff',
        lang,
      }

      const res = await fetch('/api/confirmation-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error ?? t.fail)
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Enrollment-Confirmation-${studentName.replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t.ok)
    } catch {
      toast.error(t.fail)
    } finally {
      setGenerating(false)
    }
  }

  function handleReset() {
    setStudentName(''); setStudentAge(''); setAgeGroup(cfg.ageGroups[0])
    setParentName(''); setContact(''); setEmail('')
    setStartDate(''); setClassTime(TIME_SLOTS[2]); setCustomTime('')
    setFeeType('standard'); setPaymentStatus('paid'); setAmountPaid('')
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Bootcamp Selector ── */}
      <div>
        <p className={labelCls}>{t.bootcamp_type}</p>
        <div className={`grid gap-3 ${availableBootcamps.length === 1 ? 'grid-cols-1' : availableBootcamps.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {availableBootcamps.map(key => {
            const c = BOOTCAMPS[key]
            const label = lang === 'zh' ? c.label_zh : c.label_en
            return (
              <button key={key} type="button" onClick={() => handleBootcampChange(key)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  bootcamp === key ? 'shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
                style={bootcamp === key ? { borderColor: c.color, background: c.bg } : undefined}>
                <p className="text-sm font-bold" style={{ color: bootcamp === key ? c.color : '#374151' }}>{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">RM {c.standard.toLocaleString()} / RM {c.earlyBird.toLocaleString()} (EB)</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Student Info ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t.student_info}</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Field label={t.student_name}>
              <input type="text" placeholder={t.full_name_placeholder} value={studentName}
                onChange={e => setStudentName(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label={t.student_age}>
            <input type="number" min={3} max={99} placeholder={t.age_placeholder} value={studentAge}
              onChange={e => setStudentAge(e.target.value)} className={inputCls} />
          </Field>
          <Field label={t.age_group}>
            <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className={inputCls}>
              {cfg.ageGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label={t.parent}>
            <input type="text" placeholder={t.parent_placeholder} value={parentName}
              onChange={e => setParentName(e.target.value)} className={inputCls} />
          </Field>
          <Field label={t.contact}>
            <input type="tel" placeholder={t.contact_placeholder} value={contact}
              onChange={e => setContact(e.target.value)} className={inputCls} />
          </Field>
          <div className="col-span-2">
            <Field label={t.email}>
              <input type="email" placeholder={t.email_placeholder} value={email}
                onChange={e => setEmail(e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>
      </div>

      {/* ── Program Details ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t.program_details}</p>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <Field label={t.start_date}>
            <input type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)} className={inputCls} />
          </Field>
          <Field label={t.end_date}>
            <input type="date" value={endDate} readOnly
              className={`${inputCls} bg-gray-50 text-gray-400 cursor-not-allowed`} />
          </Field>
          <div className="col-span-2">
            <Field label={t.class_time}>
              <select value={classTime} onChange={e => setClassTime(e.target.value)} className={inputCls}>
                {TIME_SLOTS.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                <option value="custom">{t.custom}</option>
              </select>
              {classTime === 'custom' && (
                <input type="text" placeholder={t.custom_placeholder} value={customTime}
                  onChange={e => setCustomTime(e.target.value)} className={`${inputCls} mt-2`} />
              )}
            </Field>
          </div>
        </div>
      </div>

      {/* ── Fee ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t.fee_payment}</p>
        </div>
        <div className="p-5 space-y-4">
          <Field label={t.fee_type}>
            <div className="flex gap-2">
              {([
                { value: 'standard'   as const, label: `${t.standard}  RM ${cfg.standard.toLocaleString()}` },
                { value: 'early_bird' as const, label: `${t.early_bird}  RM ${cfg.earlyBird.toLocaleString()}` },
              ]).map(opt => (
                <button key={opt.value} type="button" onClick={() => setFeeType(opt.value)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                    feeType === opt.value
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t.payment_status}>
            <div className="flex gap-2">
              {([
                { value: 'paid'    as const, label: t.fully_paid,   color: '#1E8449' },
                { value: 'deposit' as const, label: t.deposit_paid, color: '#B7770D' },
                { value: 'pending' as const, label: t.pending,      color: '#6B7280' },
              ]).map(opt => (
                <button key={opt.value} type="button" onClick={() => setPaymentStatus(opt.value)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                    paymentStatus === opt.value ? 'text-white' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                  style={paymentStatus === opt.value ? { backgroundColor: opt.color, borderColor: opt.color } : undefined}>
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          {paymentStatus === 'deposit' && (
            <Field label={t.amount_paid}>
              <input type="number" min={0} max={feeAmount}
                placeholder={`${t.deposit_placeholder}${Math.round(feeAmount / 2)}`}
                value={amountPaid} onChange={e => setAmountPaid(e.target.value)} className={inputCls} />
            </Field>
          )}

          {/* Fee preview */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                {t.program_fee} ({feeType === 'early_bird' ? t.early_bird_label : t.standard})
              </span>
              <span className="font-semibold">RM {feeAmount.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t.amount_paid.replace(' (RM)', '')}</span>
              <span className="font-semibold text-[#1E8449]">
                RM {(paymentStatus === 'paid' ? feeAmount : paymentStatus === 'deposit' && amountPaid ? parseFloat(amountPaid) : 0).toLocaleString()}.00
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
              <span className="font-semibold">{t.balance_due}</span>
              <span className="font-bold">
                RM {Math.max(0, feeAmount - (paymentStatus === 'paid' ? feeAmount : paymentStatus === 'deposit' && amountPaid ? parseFloat(amountPaid) : 0)).toLocaleString()}.00
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Issued By ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t.issued_by_section}</p>
        </div>
        <div className="p-5">
          <Field label={t.staff_name}>
            <input type="text" placeholder={t.full_name_placeholder} value={issuedBy}
              onChange={e => setIssuedBy(e.target.value)} className={inputCls} />
          </Field>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 pb-4">
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: '#1E8449' }}>
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {generating ? t.generating : t.generate}
        </button>
        <button onClick={handleReset} type="button"
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />
          {t.reset}
        </button>
      </div>

    </div>
  )
}
