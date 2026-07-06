'use client'

import { useState, useEffect } from 'react'
import { Loader2, FileDown, RotateCcw, GraduationCap, BookOpen, Sparkles, Plus, X, ChevronDown, History, Clock, RefreshCw, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import type { BootcampType, FeeType, PaymentStatus, ConfirmationMode } from '@/lib/pdf/bootcamp-confirmation'
import { DatePickerField } from '@/components/ui/date-picker'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'
import { CURRICULUM_DATA } from '@/lib/curriculumData'

type HistoryRow = {
  id: string
  created_at: string
  student_name: string
  mode: string
  program_name: string | null
  confirmation_number: string | null
  issued_by: string | null
  payment_status: string | null
  start_date: string | null
}

// ── Config ─────────────────────────────────────────────────────────────────

const BOOTCAMPS = {
  coding:  { label_en: 'Coding Bootcamp',  label_zh: '编程训练营',  color: '#1A5276', bg: '#EBF5FB', standard: 2600, earlyBird: 2380, ageGroups: ['6-8', '9-12'] },
  english: { label_en: 'English Bootcamp', label_zh: '英语训练营',  color: '#B7770D', bg: '#FEF9E7', standard: 2500, earlyBird: 2280, ageGroups: ['6-8', '9-12', '13+'] },
  math:    { label_en: 'Math Bootcamp',    label_zh: '数学训练营',  color: '#1E8449', bg: '#EAFAF1', standard: 2200, earlyBird: 1980, ageGroups: ['6-8', '9-12'] },
} as const

const SUBJECT_TO_BOOTCAMP: Record<string, BootcampType> = {
  coding: 'coding', english: 'english', maths: 'math',
}

function getAvailableBootcamps(subjects?: string[]): BootcampType[] {
  if (!subjects || subjects.length === 0) return ['coding', 'english', 'math']
  const mapped = subjects.map(s => SUBJECT_TO_BOOTCAMP[s]).filter((b): b is BootcampType => b !== undefined)
  return mapped.length > 0 ? mapped : ['coding', 'english', 'math']
}

const CLASS_SUBJECTS = [
  { value: 'coding',      label_en: 'Coding',       label_zh: '编程',       color: '#1A5276', bg: '#EBF5FB' },
  { value: 'english',     label_en: 'English',      label_zh: '英语',       color: '#B7770D', bg: '#FEF9E7' },
  { value: 'maths',       label_en: 'Mathematics',  label_zh: '数学',       color: '#1E8449', bg: '#EAFAF1' },
  { value: 'chinese',     label_en: 'Chinese',      label_zh: '中文',       color: '#922B21', bg: '#FDEDEC' },
  { value: 'science',     label_en: 'Science',      label_zh: '科学',       color: '#1A5276', bg: '#EBF5FB' },
  { value: 'arts',        label_en: 'Arts',         label_zh: '美术',       color: '#7D3C98', bg: '#F5EEF8' },
  { value: 'calligraphy', label_en: 'Calligraphy',  label_zh: '书法',       color: '#1C2833', bg: '#F2F3F4' },
  { value: 'custom',      label_en: 'Custom…',      label_zh: '自定义…',    color: '#6B7280', bg: '#F9FAFB' },
] as const

const WORKSHOP_COLORS = [
  { color: '#1A5276', label: 'Blue',   bg: '#EBF5FB' },
  { color: '#1E8449', label: 'Green',  bg: '#EAFAF1' },
  { color: '#B7770D', label: 'Amber',  bg: '#FEF9E7' },
  { color: '#7D3C98', label: 'Purple', bg: '#F5EEF8' },
  { color: '#922B21', label: 'Red',    bg: '#FDEDEC' },
  { color: '#1C2833', label: 'Dark',   bg: '#F2F3F4' },
]

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

async function genConfirmationNumber(supabase: ReturnType<typeof createClient>): Promise<string> {
  const year = new Date().getFullYear()
  const { data } = await supabase
    .from('confirmation_history')
    .select('confirmation_number')
    .like('confirmation_number', `TT-${year}-%`)

  let maxNum = 0
  for (const row of data ?? []) {
    if (!row.confirmation_number) continue
    const parts = (row.confirmation_number as string).split('-')
    const n = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(n) && n > maxNum) maxNum = n
  }

  return `TT-${year}-${String(maxNum + 1).padStart(5, '0')}`
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

function parseTimeRange(timeStr: string): { start: string; end: string } | null {
  const parts = timeStr.split('–').map(s => s.trim())
  if (parts.length !== 2) return null
  function to24(t: string) {
    const m = t.match(/(\d+):(\d+)\s*(AM|PM)/i)
    if (!m) return null
    let h = parseInt(m[1])
    const min = m[2]
    if (m[3].toUpperCase() === 'PM' && h !== 12) h += 12
    if (m[3].toUpperCase() === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${min}`
  }
  const start = to24(parts[0])
  const end = to24(parts[1])
  if (!start || !end) return null
  return { start, end }
}

// ── UI strings ─────────────────────────────────────────────────────────────

const UI_T = {
  en: {
    mode_bootcamp:  'Bootcamp',
    mode_class:     'Regular Class',
    mode_workshop:  'Workshop',
    bootcamp_type:  'Bootcamp Type',
    subject:        'Subject',
    custom_subject: 'Custom Subject Name',
    tier_level:     'Tier / Level',
    monthly_fee:    'Monthly Fee (RM)',
    months:         'Months Enrolled',
    total_fee:      'Total Fee',
    workshop_name:  'Workshop Name *',
    workshop_color: 'Badge Color',
    workshop_duration: 'Duration (e.g. "3 hours", "2 days")',
    student_info:   'Student Information',
    program_details:'Program Details',
    fee_payment:    'Fee & Payment',
    issued_by_section: 'Issued By',
    terms_section:  'Terms & Conditions (optional override)',
    student_name:   'Student Name *',
    student_age:    'Student Age',
    age_group:      'Age Group',
    parent:         'Parent / Guardian Name',
    contact:        'Contact Number',
    email:          'Email',
    start_date:     'Start Date *',
    end_date:       'End Date',
    end_date_opt:   'End Date (optional)',
    class_schedule: 'Class Schedule',
    venue:          'Venue (optional)',
    fee_type:       'Fee Type',
    payment_status: 'Payment Status',
    amount_paid:    'Amount Paid (RM)',
    fee_label:      'Fee Label (optional override)',
    staff_name:     'Staff Name',
    standard:       'Standard',
    early_bird:     'Early Bird',
    fully_paid:     'Fully Paid',
    deposit_paid:   'Deposit Paid',
    pending:        'Pending',
    program_fee:    'Program Fee',
    balance_due:    'Balance Due',
    add_term:       'Add term',
    terms_hint:     'Leave empty to use default T&C for this type',
    generate:       'Generate & Download PDF',
    generating:     'Generating PDF…',
    reset:          'Reset',
    custom_ph:      'e.g. 10:00 AM – 12:00 PM',
    err_name:       'Student name is required',
    err_date:       'Start date is required',
    err_workshop:   'Workshop name is required',
    ok:             'Confirmation PDF downloaded',
    fail:           'Failed to generate PDF',
  },
  zh: {
    mode_bootcamp:  '训练营',
    mode_class:     '常规课程',
    mode_workshop:  '工作坊',
    bootcamp_type:  '训练营类型',
    subject:        '科目',
    custom_subject: '自定义科目名称',
    tier_level:     '级别',
    monthly_fee:    '月费（RM）',
    months:         '报名月数',
    total_fee:      '总费用',
    workshop_name:  '工作坊名称 *',
    workshop_color: '徽章颜色',
    workshop_duration: '时长（例："3小时"、"2天"）',
    student_info:   '学生资料',
    program_details:'课程详情',
    fee_payment:    '费用与付款',
    issued_by_section: '发出者',
    terms_section:  '条款与条件（可选，覆盖默认）',
    student_name:   '学生姓名 *',
    student_age:    '学生年龄',
    age_group:      '年龄组',
    parent:         '家长/监护人姓名',
    contact:        '联系电话',
    email:          '电子邮件',
    start_date:     '开始日期 *',
    end_date:       '结束日期',
    end_date_opt:   '结束日期（可选）',
    class_schedule: '上课时间表',
    venue:          '上课地点（可选）',
    fee_type:       '费用类型',
    payment_status: '付款状态',
    amount_paid:    '已付金额（RM）',
    fee_label:      '费用标签（可选）',
    staff_name:     '员工姓名',
    standard:       '标准',
    early_bird:     '早鸟优惠',
    fully_paid:     '全额付清',
    deposit_paid:   '已付定金',
    pending:        '待付款',
    program_fee:    '课程费用',
    balance_due:    '待付余额',
    add_term:       '添加条款',
    terms_hint:     '留空则使用该类型的默认条款',
    generate:       '生成并下载 PDF',
    generating:     '正在生成 PDF…',
    reset:          '重置',
    custom_ph:      '例：10:00 AM – 12:00 PM',
    err_name:       '请填写学生姓名',
    err_date:       '请填写开始日期',
    err_workshop:   '请填写工作坊名称',
    ok:             '确认书 PDF 已下载',
    fail:           '生成 PDF 失败',
  },
}

// ── Shared input styles ────────────────────────────────────────────────────

const inputCls = "w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:border-gray-400 transition-colors"
const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5"

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-50">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Shared student info fields ─────────────────────────────────────────────

function StudentInfoFields({
  studentName, setStudentName,
  studentAge, setStudentAge,
  parentName, setParentName,
  contact, setContact,
  email, setEmail,
  t, showAge = true,
}: {
  studentName: string; setStudentName: (v: string) => void
  studentAge: string; setStudentAge: (v: string) => void
  parentName: string; setParentName: (v: string) => void
  contact: string; setContact: (v: string) => void
  email: string; setEmail: (v: string) => void
  t: typeof UI_T['en']
  showAge?: boolean
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <Field label={t.student_name}>
          <input type="text" placeholder="Full name" value={studentName}
            onChange={e => setStudentName(e.target.value)} className={inputCls} />
        </Field>
      </div>
      {showAge && (
        <Field label={t.student_age}>
          <input type="number" min={3} max={99} placeholder="e.g. 10" value={studentAge}
            onChange={e => setStudentAge(e.target.value)} className={inputCls} />
        </Field>
      )}
      <Field label={t.parent}>
        <input type="text" placeholder="Parent name" value={parentName}
          onChange={e => setParentName(e.target.value)} className={inputCls} />
      </Field>
      <Field label={t.contact}>
        <input type="tel" placeholder="+60 12-345 6789" value={contact}
          onChange={e => setContact(e.target.value)} className={inputCls} />
      </Field>
      <div className="sm:col-span-2">
        <Field label={t.email}>
          <input type="email" placeholder="parent@email.com" value={email}
            onChange={e => setEmail(e.target.value)} className={inputCls} />
        </Field>
      </div>
    </div>
  )
}

// ── Fee preview ────────────────────────────────────────────────────────────

function FeePreview({
  feeAmount, feeLabelText, paymentStatus, amountPaid, t,
}: {
  feeAmount: number; feeLabelText: string; paymentStatus: PaymentStatus; amountPaid: string; t: typeof UI_T['en']
}) {
  const paid = paymentStatus === 'paid' ? feeAmount : (amountPaid ? parseFloat(amountPaid) : 0)
  const balance = Math.max(0, feeAmount - paid)
  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{feeLabelText}</span>
        <span className="font-semibold">RM {feeAmount.toLocaleString()}.00</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{t.amount_paid.replace(' (RM)', '')}</span>
        <span className="font-semibold text-[#1E8449]">RM {paid.toLocaleString()}.00</span>
      </div>
      <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
        <span className="font-semibold">{t.balance_due}</span>
        <span className="font-bold">RM {balance.toLocaleString()}.00</span>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface Props {
  currentUserName?: string
  subjects?: string[]
  branches?: string[]
  tiers?: string[]
}

export function BootcampConfirmationTab({ currentUserName, subjects, branches = [], tiers = [] }: Props) {
  const { lang } = useCmsLang()
  const t = UI_T[lang]
  const supabase = createClient()

  const [mode, setMode] = useState<ConfirmationMode>('bootcamp')
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  async function loadHistory() {
    setHistoryLoading(true)
    setHistoryError(null)
    const { data, error } = await supabase
      .from('confirmation_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) setHistoryError(error.message)
    setHistory(data ?? [])
    setHistoryLoading(false)
  }

  useEffect(() => { loadHistory() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Shared ──
  const [studentName, setStudentName] = useState('')
  const [studentAge, setStudentAge] = useState('')
  const [parentName, setParentName] = useState('')
  const [contact, setContact] = useState('')
  const [email, setEmail] = useState('')
  const [startDate, setStartDate] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid')
  const [amountPaid, setAmountPaid] = useState('')
  const [issuedBy, setIssuedBy] = useState(currentUserName ?? '')
  const [generating, setGenerating] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [modalBranch, setModalBranch] = useState('')
  const [modalTier, setModalTier] = useState('')
  const [modalAlsoCalendar, setModalAlsoCalendar] = useState(true)
  const [modalTierCustom, setModalTierCustom] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAsStudent, setSavedAsStudent] = useState(false)

  // ── Bootcamp ──
  const availableBootcamps = getAvailableBootcamps(subjects)
  const [bootcamp, setBootcamp] = useState<BootcampType>(availableBootcamps[0])
  const [ageGroup, setAgeGroup] = useState<string>(BOOTCAMPS[availableBootcamps[0]].ageGroups[0])
  const [classTime, setClassTime] = useState(TIME_SLOTS[2])
  const [customTime, setCustomTime] = useState('')
  const [feeType, setFeeType] = useState<FeeType>('standard')

  // ── Regular Class ──
  const [classSubject, setClassSubject] = useState<string>('coding')
  const [customSubjectName, setCustomSubjectName] = useState('')
  const [classTier, setClassTier] = useState('')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [months, setMonths] = useState('1')
  const [classSchedule, setClassSchedule] = useState('')
  const [classEndDate, setClassEndDate] = useState('')
  const [classVenue, setClassVenue] = useState('')

  // ── Workshop ──
  const [workshopName, setWorkshopName] = useState('')
  const [workshopColor, setWorkshopColor] = useState(WORKSHOP_COLORS[0].color)
  const [workshopDate, setWorkshopDate] = useState('')
  const [workshopEndDate, setWorkshopEndDate] = useState('')
  const [workshopTime, setWorkshopTime] = useState('')
  const [workshopDuration, setWorkshopDuration] = useState('')
  const [workshopVenue, setWorkshopVenue] = useState('')
  const [workshopFee, setWorkshopFee] = useState('')
  const [workshopFeeLabel, setWorkshopFeeLabel] = useState('')
  const [customTerms, setCustomTerms] = useState<string[]>([])
  const [newTerm, setNewTerm] = useState('')

  // ── Bootcamp end date (auto-calculated, user can override) ──
  const [bcEndDateCustom, setBcEndDateCustom] = useState('')
  useEffect(() => {
    setBcEndDateCustom(startDate ? addWorkingDays(startDate, 9) : '')
  }, [startDate])

  // ── Bootcamp derived values ──
  const bcCfg = BOOTCAMPS[bootcamp]
  const bcFeeAmount = feeType === 'early_bird' ? bcCfg.earlyBird : bcCfg.standard
  const bcEffectiveTime = classTime === 'custom' ? customTime : classTime

  // ── Class derived values ──
  const selectedClassSubject = CLASS_SUBJECTS.find(s => s.value === classSubject)
  const classColor = selectedClassSubject?.color ?? '#6B7280'
  const classTotalFee = monthlyFee ? Math.round(parseFloat(monthlyFee) * parseInt(months || '1', 10)) : 0

  function handleBootcampChange(b: BootcampType) {
    setBootcamp(b)
    setAgeGroup(BOOTCAMPS[b].ageGroups[0])
  }

  function addTerm() {
    const trimmed = newTerm.trim()
    if (trimmed) { setCustomTerms(prev => [...prev, trimmed]); setNewTerm('') }
  }
  function removeTerm(i: number) {
    setCustomTerms(prev => prev.filter((_, idx) => idx !== i))
  }

  // ── Build payload + generate ───────────────────────────────────────────
  async function handleGenerate() {
    if (!studentName.trim()) { toast.error(t.err_name); return }
    if (!startDate && mode !== 'workshop') { toast.error(t.err_date); return }
    if (mode === 'workshop' && !workshopName.trim()) { toast.error(t.err_workshop); return }
    if (mode === 'workshop' && !workshopDate) { toast.error(t.err_date); return }

    setGenerating(true)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let payload: any = {
        mode,
        student_name: studentName.trim(),
        student_age: studentAge,
        parent_name: parentName.trim(),
        contact: contact.trim(),
        email: email.trim(),
        payment_status: paymentStatus,
        amount_paid: amountPaid,
        confirmation_number: await genConfirmationNumber(supabase),
        issue_date: new Date().toISOString().split('T')[0],
        issued_by: issuedBy.trim() || 'Triple Tree Staff',
        lang,
      }

      if (mode === 'bootcamp') {
        payload = {
          ...payload,
          bootcamp_type: bootcamp,
          age_group: ageGroup,
          fee_type: feeType,
          start_date: startDate,
          end_date: bcEndDateCustom,
          class_time: bcEffectiveTime,
          amount_paid: amountPaid || String(paymentStatus === 'paid' ? bcFeeAmount : 0),
        }
      } else if (mode === 'class') {
        const subjectLabel = classSubject === 'custom'
          ? customSubjectName
          : (lang === 'zh' ? selectedClassSubject?.label_zh : selectedClassSubject?.label_en)
        const tierSuffix = classTier ? ` – ${classTier}` : ''
        const monthLabel = parseInt(months) > 1
          ? (lang === 'zh' ? `（×${months}个月）` : ` (×${months} months)`)
          : ''
        payload = {
          ...payload,
          program_name: `${subjectLabel}${tierSuffix}`,
          program_color: classColor,
          fee_amount: classTotalFee,
          fee_label: lang === 'zh'
            ? `月费（RM ${monthlyFee}${monthLabel}）`
            : `Monthly Tuition Fee (RM ${monthlyFee}${monthLabel})`,
          start_date: startDate,
          end_date: classEndDate || undefined,
          class_time: classSchedule,
          venue: classVenue || undefined,
          custom_terms: customTerms.length > 0 ? customTerms : undefined,
          amount_paid: amountPaid || String(paymentStatus === 'paid' ? classTotalFee : 0),
        }
      } else {
        payload = {
          ...payload,
          program_name: workshopName.trim(),
          program_color: workshopColor,
          fee_amount: parseFloat(workshopFee) || 0,
          fee_label: workshopFeeLabel.trim() || (lang === 'zh' ? '工作坊费用' : 'Workshop Fee'),
          start_date: workshopDate,
          end_date: workshopEndDate || undefined,
          class_time: workshopTime || undefined,
          duration_label: workshopDuration || undefined,
          venue: workshopVenue || undefined,
          custom_terms: customTerms.length > 0 ? customTerms : undefined,
          amount_paid: amountPaid || String(paymentStatus === 'paid' ? (parseFloat(workshopFee) || 0) : 0),
        }
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
      const modePrefix = mode === 'bootcamp' ? 'Bootcamp' : mode === 'class' ? 'Class' : 'Workshop'
      a.download = `${modePrefix}-Confirmation-${studentName.replace(/\s+/g, '-')}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(t.ok)

      // Auto-add to calendar
      const calEventDate = mode === 'workshop' ? workshopDate : startDate
      if (calEventDate) {
        const calTimeStr = mode === 'bootcamp' ? bcEffectiveTime : mode === 'class' ? classSchedule : workshopTime
        const calTimes = parseTimeRange(calTimeStr)
        const calSubject = getDerivedSubject()
        const calTitle = mode === 'bootcamp'
          ? `${lang === 'zh' ? BOOTCAMPS[bootcamp].label_zh : BOOTCAMPS[bootcamp].label_en} – ${studentName.trim()}`
          : mode === 'class'
          ? `${classSubject === 'custom' ? customSubjectName : classSubject}${classTier ? ` – ${classTier}` : ''} – ${studentName.trim()}`
          : `${workshopName} – ${studentName.trim()}`
        const calColour = mode === 'bootcamp' ? BOOTCAMPS[bootcamp].color : mode === 'class' ? classColor : workshopColor
        await supabase.from('schedule_events').insert({
          subject: calSubject,
          title: calTitle,
          description: `Confirmation #${payload.confirmation_number}`,
          event_date: calEventDate,
          start_time: calTimes?.start ?? '09:00',
          end_time: calTimes?.end ?? '11:00',
          event_type: mode === 'workshop' ? 'other' : 'class',
          colour: calColour,
          class_id: null,
          teacher_id: null,
          meeting_link: null,
          created_by: null,
        })
      }

      // Save to history
      const { data: { user } } = await supabase.auth.getUser()
      const programLabel = mode === 'bootcamp'
        ? (lang === 'zh' ? BOOTCAMPS[bootcamp].label_zh : BOOTCAMPS[bootcamp].label_en)
        : mode === 'class'
        ? `${classSubject === 'custom' ? customSubjectName : classSubject}${classTier ? ` – ${classTier}` : ''}`
        : workshopName
      await supabase.from('confirmation_history').insert({
        student_name:        studentName.trim(),
        mode,
        program_name:        programLabel,
        confirmation_number: payload.confirmation_number,
        issued_by:           issuedBy.trim() || 'Triple Tree Staff',
        payment_status:      paymentStatus,
        start_date:          (mode === 'bootcamp' ? startDate : mode === 'class' ? startDate : workshopDate) || null,
        created_by:          user?.id ?? null,
      })
      loadHistory()
    } catch {
      toast.error(t.fail)
    } finally {
      setGenerating(false)
    }
  }

  function getDerivedSubject(): string {
    if (mode === 'bootcamp') return bootcamp === 'math' ? 'maths' : bootcamp
    if (mode === 'class') return classSubject === 'custom' ? 'coding' : classSubject
    return 'coding'
  }

  function handleSaveAsStudent() {
    if (!studentName.trim()) { toast.error(t.err_name); return }
    setModalTier(mode === 'class' ? classTier : '')
    setShowSaveModal(true)
  }

  async function confirmSaveAsStudent() {
    if (!modalBranch.trim()) { toast.error('Branch is required'); return }
    setSaving(true)
    try {
      const subject = getDerivedSubject()
      const feeStatusMap: Record<PaymentStatus, 'paid' | 'partial' | 'unpaid'> = {
        paid: 'paid', deposit: 'partial', pending: 'unpaid',
      }
      const eventDate = mode === 'workshop' ? workshopDate : startDate
      const { data: { user } } = await supabase.auth.getUser()

      const resolvedTier = modalTier === '__custom__'
        ? modalTierCustom.trim()
        : modalTier.trim() || (mode === 'bootcamp' ? 'Bootcamp' : 'Standard')

      const classTierValue = resolvedTier || (mode === 'bootcamp' ? 'Bootcamp' : 'Standard')
      const timeStr = mode === 'bootcamp' ? bcEffectiveTime : mode === 'class' ? classSchedule : workshopTime
      const times = parseTimeRange(timeStr)

      // 1. Insert student
      const { data: newStudent, error: studentError } = await supabase.from('students').insert({
        name: studentName.trim(),
        age: parseInt(studentAge) || 0,
        tier: classTierValue,
        branch: modalBranch.trim(),
        subject,
        module_current: 0,
        module_total: mode === 'bootcamp' ? 10 : parseInt(months || '1') * 4,
        enrolled_date: eventDate || new Date().toISOString().split('T')[0],
        parent_name: parentName.trim() || null,
        parent_contact: contact.trim() || null,
        parent_email: email.trim() || null,
        fee_status: feeStatusMap[paymentStatus],
        is_bootcamp: mode === 'bootcamp',
        bootcamp_start_date: mode === 'bootcamp' ? startDate || null : null,
        bootcamp_end_date: mode === 'bootcamp' ? bcEndDateCustom || null : null,
        bootcamp_time: mode === 'bootcamp' ? bcEffectiveTime || null : null,
        teacher_id: null,
      }).select('id').single()
      if (studentError) throw studentError

      // 2. Create class record so it appears on the Classes page
      const programLabel = mode === 'bootcamp'
        ? (lang === 'zh' ? BOOTCAMPS[bootcamp].label_zh : BOOTCAMPS[bootcamp].label_en)
        : mode === 'class'
        ? `${classSubject === 'custom' ? customSubjectName : classSubject}`
        : workshopName
      const { data: newClass, error: classError } = await supabase.from('classes').insert({
        tier: classTierValue,
        branch: modalBranch.trim(),
        subject,
        schedule_day: null,
        schedule_time: times?.start ?? null,
        teacher_id: null,
      }).select('id').single()
      if (classError) throw classError

      // 3. Enrol student into class
      const { error: enrollError } = await supabase.from('class_students').insert({
        class_id: newClass.id,
        student_id: newStudent.id,
      })
      if (enrollError) throw enrollError

      // 4. Add to calendar linked to the new class
      if (modalAlsoCalendar && eventDate) {
        await supabase.from('schedule_events').insert({
          subject,
          title: `${programLabel} – ${studentName.trim()}`,
          description: null,
          event_date: eventDate,
          start_time: times?.start ?? '09:00',
          end_time: times?.end ?? '11:00',
          event_type: mode === 'workshop' ? 'other' : 'class',
          colour: mode === 'bootcamp' ? BOOTCAMPS[bootcamp].color : classColor,
          class_id: newClass.id,
          teacher_id: null,
          meeting_link: null,
          created_by: user?.id ?? null,
        })
      }

      toast.success(`${studentName.trim()} saved as student!`)
      setShowSaveModal(false)
      setModalBranch('')
      setSavedAsStudent(true)
    } catch (err: unknown) {
      toast.error(`Save failed: ${(err as Error).message}`)
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setSavedAsStudent(false)
    setStudentName(''); setStudentAge(''); setParentName('')
    setContact(''); setEmail(''); setStartDate('')
    setPaymentStatus('paid'); setAmountPaid('')
    setClassTime(TIME_SLOTS[2]); setCustomTime(''); setFeeType('standard')
    setAgeGroup(BOOTCAMPS[bootcamp].ageGroups[0])
    setClassSubject('coding'); setCustomSubjectName(''); setClassTier('')
    setMonthlyFee(''); setMonths('1'); setClassSchedule('')
    setClassEndDate(''); setClassVenue('')
    setWorkshopName(''); setWorkshopDate(''); setWorkshopEndDate('')
    setWorkshopTime(''); setWorkshopDuration(''); setWorkshopVenue('')
    setWorkshopFee(''); setWorkshopFeeLabel(''); setCustomTerms([])
  }

  function fillFromHistory(h: HistoryRow) {
    handleReset()
    setMode(h.mode as ConfirmationMode)
    setStudentName(h.student_name)
    // intentionally NOT overwriting issuedBy — the current staff member stays
    if (h.payment_status) setPaymentStatus(h.payment_status as PaymentStatus)

    if (h.mode === 'bootcamp') {
      if (h.start_date) setStartDate(h.start_date)
      if (h.program_name) {
        const bcKey = (Object.keys(BOOTCAMPS) as BootcampType[]).find(k =>
          BOOTCAMPS[k].label_en === h.program_name || BOOTCAMPS[k].label_zh === h.program_name
        )
        if (bcKey) { setBootcamp(bcKey); setAgeGroup(BOOTCAMPS[bcKey].ageGroups[0]) }
      }
    } else if (h.mode === 'class') {
      if (h.start_date) setStartDate(h.start_date)
      if (h.program_name) {
        const [subjectRaw, ...tierParts] = h.program_name.split(' – ')
        const matched = CLASS_SUBJECTS.find(s =>
          s.value === subjectRaw || s.label_en === subjectRaw || s.label_zh === subjectRaw
        )
        if (matched) setClassSubject(matched.value)
        else { setClassSubject('custom'); setCustomSubjectName(subjectRaw) }
        const tierStr = tierParts.join(' – ')
        if (tierStr) setClassTier(tierStr)
      }
    } else if (h.mode === 'workshop') {
      if (h.start_date) setWorkshopDate(h.start_date)
      if (h.program_name) setWorkshopName(h.program_name)
    }

    setShowHistory(false)
    toast.success('Form pre-filled — update as needed')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const MODE_LABELS: Record<string, string> = { bootcamp: 'Bootcamp', class: 'Regular Class', workshop: 'Workshop' }
  const STATUS_COLORS: Record<string, string> = { paid: '#1E8449', deposit: '#B7770D', pending: '#6B7280' }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── History toggle ── */}
      <div className="flex items-center justify-between">
        <div />
        <button
          type="button"
          onClick={() => setShowHistory(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <History className="w-4 h-4" />
          {showHistory ? 'Hide History' : `History (${history.length})`}
        </button>
      </div>

      {/* ── History panel ── */}
      {showHistory && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex-1">Confirmation History</p>
            <button type="button" onClick={loadHistory} disabled={historyLoading}
              className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40">
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {historyLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : historyError ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-sm text-red-500">Could not load history</p>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">{historyError}</p>
              <button type="button" onClick={loadHistory} className="text-xs text-blue-500 hover:underline mt-1">Try again</button>
            </div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No confirmations generated yet.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {history.map(h => (
                <div key={h.id} onClick={() => fillFromHistory(h)}
                  className="px-5 py-3.5 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-gray-50">
                    {h.mode === 'bootcamp' ? <GraduationCap className="w-4 h-4 text-[#1A5276]" /> : h.mode === 'class' ? <BookOpen className="w-4 h-4 text-[#1E8449]" /> : <Sparkles className="w-4 h-4 text-[#7D3C98]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{h.student_name}</p>
                    <p className="text-xs text-gray-500 truncate">{h.program_name ?? MODE_LABELS[h.mode]}</p>
                    {h.confirmation_number && (
                      <p className="text-[11px] font-mono text-gray-400 mt-0.5">{h.confirmation_number}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {h.payment_status && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: STATUS_COLORS[h.payment_status] + '18', color: STATUS_COLORS[h.payment_status] }}>
                        {h.payment_status}
                      </span>
                    )}
                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {new Date(h.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                      Click to pre-fill
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Mode selector ── */}
      <div>
        <p className={labelCls}>Confirmation Type</p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: 'bootcamp' as const, label: t.mode_bootcamp, icon: GraduationCap, color: '#1A5276', bg: '#EBF5FB' },
            { key: 'class'    as const, label: t.mode_class,    icon: BookOpen,       color: '#1E8449', bg: '#EAFAF1' },
            { key: 'workshop' as const, label: t.mode_workshop,  icon: Sparkles,       color: '#7D3C98', bg: '#F5EEF8' },
          ]).map(({ key, label, icon: Icon, color, bg }) => (
            <button key={key} type="button" onClick={() => setMode(key)}
              className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col gap-2 ${
                mode === key ? 'shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
              style={mode === key ? { borderColor: color, background: bg } : undefined}>
              <Icon className="w-5 h-5" style={{ color: mode === key ? color : '#9CA3AF' }} />
              <p className="text-sm font-bold" style={{ color: mode === key ? color : '#374151' }}>{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ════════ BOOTCAMP ════════ */}
      {mode === 'bootcamp' && (<>
        {/* Bootcamp type selector */}
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

        <Section title={t.student_info}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label={t.student_name}>
                <input type="text" placeholder="Full name" value={studentName}
                  onChange={e => setStudentName(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <Field label={t.student_age}>
              <input type="number" min={3} max={99} placeholder="e.g. 10" value={studentAge}
                onChange={e => setStudentAge(e.target.value)} className={inputCls} />
            </Field>
            <Field label={t.age_group}>
              <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className={inputCls}>
                {bcCfg.ageGroups.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label={t.parent}>
              <input type="text" placeholder="Parent name" value={parentName}
                onChange={e => setParentName(e.target.value)} className={inputCls} />
            </Field>
            <Field label={t.contact}>
              <input type="tel" placeholder="+60 12-345 6789" value={contact}
                onChange={e => setContact(e.target.value)} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <Field label={t.email}>
                <input type="email" placeholder="parent@email.com" value={email}
                  onChange={e => setEmail(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>
        </Section>

        <Section title={t.program_details}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t.start_date}>
              <DatePickerField value={startDate} onChange={setStartDate} placeholder="Pick start date" />
            </Field>
            <Field label={t.end_date} hint="Auto-filled from start date, can be overridden">
              <DatePickerField value={bcEndDateCustom} onChange={setBcEndDateCustom} placeholder="Pick end date" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Class Time">
                <Select value={classTime} onValueChange={v => setClassTime(v ?? TIME_SLOTS[2])}>
                  <SelectTrigger className={`${inputCls} flex items-center`}>
                    <span className="flex flex-1 text-sm text-left">
                      {classTime === 'custom' ? (lang === 'zh' ? '自定义…' : 'Custom…') : classTime}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
                    <SelectItem value="custom">{lang === 'zh' ? '自定义…' : 'Custom…'}</SelectItem>
                  </SelectContent>
                </Select>
                {classTime === 'custom' && (
                  <input type="text" placeholder={t.custom_ph} value={customTime}
                    onChange={e => setCustomTime(e.target.value)} className={`${inputCls} mt-2`} />
                )}
              </Field>
            </div>
          </div>
        </Section>

        <Section title={t.fee_payment}>
          <div className="space-y-4">
            <Field label={t.fee_type}>
              <div className="flex gap-2">
                {([
                  { value: 'standard'   as const, label: `${t.standard}  RM ${bcCfg.standard.toLocaleString()}` },
                  { value: 'early_bird' as const, label: `${t.early_bird}  RM ${bcCfg.earlyBird.toLocaleString()}` },
                ]).map(opt => (
                  <button key={opt.value} type="button" onClick={() => setFeeType(opt.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                      feeType === opt.value ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>
            <PaymentStatusField paymentStatus={paymentStatus} setPaymentStatus={setPaymentStatus} feeAmount={bcFeeAmount} amountPaid={amountPaid} setAmountPaid={setAmountPaid} t={t} />
            <FeePreview feeAmount={bcFeeAmount} feeLabelText={feeType === 'early_bird' ? (lang === 'zh' ? '课程费用（早鸟优惠）' : 'Program Fee (Early Bird)') : (lang === 'zh' ? '课程费用（标准）' : 'Program Fee (Standard)')} paymentStatus={paymentStatus} amountPaid={amountPaid || String(paymentStatus === 'paid' ? bcFeeAmount : 0)} t={t} />
          </div>
        </Section>
      </>)}

      {/* ════════ REGULAR CLASS ════════ */}
      {mode === 'class' && (<>
        <Section title={t.subject}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CLASS_SUBJECTS.map(subj => {
                const label = lang === 'zh' ? subj.label_zh : subj.label_en
                const active = classSubject === subj.value
                return (
                  <button key={subj.value} type="button" onClick={() => setClassSubject(subj.value)}
                    className={`py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                      active ? 'shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                    style={active ? { borderColor: subj.color, background: subj.bg, color: subj.color } : { color: '#6B7280' }}>
                    {label}
                  </button>
                )
              })}
            </div>
            {classSubject === 'custom' && (
              <Field label={t.custom_subject}>
                <input type="text" placeholder={lang === 'zh' ? '例：绘画' : 'e.g. Drawing'} value={customSubjectName}
                  onChange={e => setCustomSubjectName(e.target.value)} className={inputCls} />
              </Field>
            )}
          </div>
        </Section>

        <Section title={t.student_info}>
          <StudentInfoFields studentName={studentName} setStudentName={setStudentName}
            studentAge={studentAge} setStudentAge={setStudentAge}
            parentName={parentName} setParentName={setParentName}
            contact={contact} setContact={setContact}
            email={email} setEmail={setEmail} t={t} />
        </Section>

        <Section title={t.program_details}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={t.start_date}>
              <DatePickerField value={startDate} onChange={setStartDate} placeholder="Pick start date" />
            </Field>
            <Field label={t.end_date_opt}>
              <DatePickerField value={classEndDate} onChange={setClassEndDate} placeholder="Pick end date" />
            </Field>
            <div className="sm:col-span-2">
              <Field label={t.class_schedule}>
                <input type="text" placeholder={lang === 'zh' ? '例：每周二 & 四，4:00 PM – 5:30 PM' : 'e.g. Every Tue & Thu, 4:00 PM – 5:30 PM'} value={classSchedule}
                  onChange={e => setClassSchedule(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label={t.venue}>
                <input type="text" placeholder="L2-12, 1 Mont Kiara, KL" value={classVenue}
                  onChange={e => setClassVenue(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>
        </Section>

        <Section title={t.fee_payment}>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={t.monthly_fee}>
                <input type="number" min={0} placeholder="e.g. 350" value={monthlyFee}
                  onChange={e => setMonthlyFee(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t.months}>
                <select value={months} onChange={e => setMonths(e.target.value)} className={inputCls}>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={String(n)}>{n} {lang === 'zh' ? '个月' : n === 1 ? 'month' : 'months'}</option>
                  ))}
                </select>
              </Field>
            </div>
            {monthlyFee && (
              <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50">
                <span className="text-gray-500">{t.total_fee}:</span>
                <span className="font-bold text-gray-900">RM {classTotalFee.toLocaleString()}.00</span>
              </div>
            )}
            <PaymentStatusField paymentStatus={paymentStatus} setPaymentStatus={setPaymentStatus} feeAmount={classTotalFee} amountPaid={amountPaid} setAmountPaid={setAmountPaid} t={t} />
            {monthlyFee && (
              <FeePreview feeAmount={classTotalFee}
                feeLabelText={lang === 'zh' ? `月费（×${months}个月）` : `Monthly Tuition (×${months} month${parseInt(months) > 1 ? 's' : ''})`}
                paymentStatus={paymentStatus} amountPaid={amountPaid || String(paymentStatus === 'paid' ? classTotalFee : 0)} t={t} />
            )}
          </div>
        </Section>

        <TermsOverrideSection t={t} customTerms={customTerms} newTerm={newTerm}
          setNewTerm={setNewTerm} addTerm={addTerm} removeTerm={removeTerm} />
      </>)}

      {/* ════════ WORKSHOP ════════ */}
      {mode === 'workshop' && (<>
        <Section title="Workshop Details">
          <div className="space-y-4">
            <Field label={t.workshop_name}>
              <input type="text" placeholder={lang === 'zh' ? '例：Python 入门工作坊' : 'e.g. Python Intro Workshop'} value={workshopName}
                onChange={e => setWorkshopName(e.target.value)} className={inputCls} />
            </Field>
            <Field label={t.workshop_color}>
              <div className="flex gap-2 flex-wrap">
                {WORKSHOP_COLORS.map(wc => (
                  <button key={wc.color} type="button" onClick={() => setWorkshopColor(wc.color)}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${workshopColor === wc.color ? 'border-gray-900 scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: wc.color }}
                    title={wc.label} />
                ))}
              </div>
            </Field>
          </div>
        </Section>

        <Section title={t.student_info}>
          <StudentInfoFields studentName={studentName} setStudentName={setStudentName}
            studentAge={studentAge} setStudentAge={setStudentAge}
            parentName={parentName} setParentName={setParentName}
            contact={contact} setContact={setContact}
            email={email} setEmail={setEmail} t={t} showAge={false} />
        </Section>

        <Section title={t.program_details}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label={lang === 'zh' ? '工作坊日期 *' : 'Workshop Date *'}>
              <DatePickerField value={workshopDate} onChange={setWorkshopDate} placeholder="Pick workshop date" />
            </Field>
            <Field label={lang === 'zh' ? '结束日期（可选）' : 'End Date (optional)'}>
              <DatePickerField value={workshopEndDate} onChange={setWorkshopEndDate} placeholder="Pick end date" />
            </Field>
            <Field label={lang === 'zh' ? '时间' : 'Time'}>
              <input type="text" placeholder="9:00 AM – 12:00 PM" value={workshopTime}
                onChange={e => setWorkshopTime(e.target.value)} className={inputCls} />
            </Field>
            <Field label={t.workshop_duration}>
              <input type="text" placeholder={lang === 'zh' ? '例：3小时' : 'e.g. 3 hours'} value={workshopDuration}
                onChange={e => setWorkshopDuration(e.target.value)} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <Field label={t.venue}>
                <input type="text" placeholder="L2-12, 1 Mont Kiara, KL" value={workshopVenue}
                  onChange={e => setWorkshopVenue(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>
        </Section>

        <Section title={t.fee_payment}>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label={lang === 'zh' ? '工作坊费用（RM）' : 'Workshop Fee (RM)'}>
                <input type="number" min={0} placeholder="e.g. 200" value={workshopFee}
                  onChange={e => setWorkshopFee(e.target.value)} className={inputCls} />
              </Field>
              <Field label={t.fee_label}>
                <input type="text" placeholder={lang === 'zh' ? '例：工作坊费用' : 'e.g. Workshop Fee'} value={workshopFeeLabel}
                  onChange={e => setWorkshopFeeLabel(e.target.value)} className={inputCls} />
              </Field>
            </div>
            <PaymentStatusField paymentStatus={paymentStatus} setPaymentStatus={setPaymentStatus} feeAmount={parseFloat(workshopFee) || 0} amountPaid={amountPaid} setAmountPaid={setAmountPaid} t={t} />
            {workshopFee && (
              <FeePreview feeAmount={parseFloat(workshopFee) || 0}
                feeLabelText={workshopFeeLabel || (lang === 'zh' ? '工作坊费用' : 'Workshop Fee')}
                paymentStatus={paymentStatus} amountPaid={amountPaid || String(paymentStatus === 'paid' ? (parseFloat(workshopFee) || 0) : 0)} t={t} />
            )}
          </div>
        </Section>

        <TermsOverrideSection t={t} customTerms={customTerms} newTerm={newTerm}
          setNewTerm={setNewTerm} addTerm={addTerm} removeTerm={removeTerm}
          placeholder={lang === 'zh' ? '例：确认报名后费用不予退还' : 'e.g. Registration fees are non-refundable once confirmed'} />
      </>)}

      {/* ── Issued By (shared) ── */}
      <Section title={t.issued_by_section}>
        <Field label={t.staff_name}>
          <input type="text" placeholder="Full name" value={issuedBy}
            onChange={e => setIssuedBy(e.target.value)} className={inputCls} />
        </Field>
      </Section>

      {/* ── Actions ── */}
      <div className="flex gap-3 pb-4 flex-wrap">
        <button onClick={handleGenerate} disabled={generating}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: '#1E8449' }}>
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          {generating ? t.generating : t.generate}
        </button>
        <button type="button" onClick={handleSaveAsStudent} disabled={savedAsStudent}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-70"
          style={{ background: savedAsStudent ? '#1E8449' : '#1A5276' }}>
          <UserPlus className="w-4 h-4" />
          {savedAsStudent ? 'Saved to System ✓' : 'Save as Class & Student'}
        </button>
        <button onClick={handleReset} type="button"
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" />
          {t.reset}
        </button>
      </div>

      {/* ── Save as Student modal ── */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowSaveModal(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#1A5276]" />
                <p className="font-bold text-gray-900">Save as Class &amp; Student</p>
              </div>
              <button type="button" onClick={() => setShowSaveModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Will be saved */}
              <div className="bg-green-50 rounded-xl p-4 space-y-1.5">
                <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-2">Will be saved</p>
                {[
                  { label: 'Name',    value: studentName },
                  { label: 'Age',     value: studentAge || '—' },
                  { label: 'Parent',  value: parentName || '—' },
                  { label: 'Contact', value: contact || '—' },
                  { label: 'Email',   value: email || '—' },
                  { label: 'Subject', value: getDerivedSubject() },
                  { label: 'Date',    value: (mode === 'workshop' ? workshopDate : startDate) || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-2 text-sm">
                    <span className="text-green-600 w-16 shrink-0 font-medium text-xs">{label}</span>
                    <span className="text-gray-700 text-xs">{value}</span>
                  </div>
                ))}
              </div>

              {/* Required */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Required</p>
                <Field label="Branch *">
                  {branches.length > 0 ? (
                    <Select value={modalBranch} onValueChange={v => setModalBranch(v ?? '')}>
                      <SelectTrigger className={`${inputCls} flex items-center`}>
                        <span className="flex flex-1 text-sm text-left">
                          {modalBranch || <span className="text-gray-400">Select branch…</span>}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <input type="text" placeholder="e.g. Mont Kiara, Bangsar" value={modalBranch}
                      onChange={e => setModalBranch(e.target.value)} className={inputCls} autoFocus />
                  )}
                </Field>
              </div>

              {/* Optional */}
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Optional</p>

                {/* Tier — coding only */}
                {getDerivedSubject() === 'coding' && (() => {
                  const allTiers = [...new Set([...CURRICULUM_DATA.map(t => t.name), ...tiers])]
                  return (
                    <Field label="Tier / Level">
                      <Select value={modalTier} onValueChange={v => { setModalTier(v ?? ''); setModalTierCustom('') }}>
                        <SelectTrigger className={`${inputCls} flex items-center`}>
                          <span className="flex flex-1 text-sm text-left">
                            {modalTier === '__custom__' ? (modalTierCustom || 'Custom…') : modalTier || <span className="text-gray-400">Select tier…</span>}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">— None —</SelectItem>
                          {allTiers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          <SelectItem value="__custom__">Custom…</SelectItem>
                        </SelectContent>
                      </Select>
                      {modalTier === '__custom__' && (
                        <input type="text" placeholder="e.g. Python Beginner" value={modalTierCustom}
                          onChange={e => setModalTierCustom(e.target.value)}
                          className={`${inputCls} mt-2`} autoFocus />
                      )}
                    </Field>
                  )
                })()}

              </div>

              {/* Calendar option */}
              <button
                type="button"
                onClick={() => setModalAlsoCalendar(v => !v)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left"
                style={modalAlsoCalendar
                  ? { borderColor: '#1A5276', background: '#EBF5FB' }
                  : { borderColor: '#E5E7EB', background: 'white' }}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors"
                  style={modalAlsoCalendar
                    ? { background: '#1A5276', borderColor: '#1A5276' }
                    : { background: 'white', borderColor: '#D1D5DB' }}
                >
                  {modalAlsoCalendar && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: modalAlsoCalendar ? '#1A5276' : '#374151' }}>Also add to calendar</p>
                  <p className="text-xs text-gray-400">Creates a schedule event for the start date</p>
                </div>
              </button>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={confirmSaveAsStudent} disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
                style={{ background: '#1A5276' }}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Saving…' : 'Save Student'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Extracted sub-components ───────────────────────────────────────────────

function PaymentStatusField({
  paymentStatus, setPaymentStatus, feeAmount, amountPaid, setAmountPaid, t,
}: {
  paymentStatus: PaymentStatus
  setPaymentStatus: (v: PaymentStatus) => void
  feeAmount: number
  amountPaid: string
  setAmountPaid: (v: string) => void
  t: typeof UI_T['en']
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className={labelCls}>{t.payment_status}</label>
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
      </div>
      {paymentStatus === 'deposit' && (
        <div>
          <label className={labelCls}>{t.amount_paid}</label>
          <input type="number" min={0} max={feeAmount}
            placeholder={`e.g. ${Math.round(feeAmount / 2)}`}
            value={amountPaid} onChange={e => setAmountPaid(e.target.value)} className={inputCls} />
        </div>
      )}
    </div>
  )
}

function TermsOverrideSection({
  t, customTerms, newTerm, setNewTerm, addTerm, removeTerm, placeholder,
}: {
  t: typeof UI_T['en']
  customTerms: string[]
  newTerm: string
  setNewTerm: (v: string) => void
  addTerm: () => void
  removeTerm: (i: number) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t.terms_section}</p>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-50">
          <p className="text-xs text-gray-400 pt-3">{t.terms_hint}</p>
          {customTerms.map((term, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
              <span className="text-[10px] font-bold text-gray-400 mt-0.5 w-4 shrink-0">{i + 1}.</span>
              <p className="text-xs text-gray-700 flex-1 leading-relaxed">{term}</p>
              <button type="button" onClick={() => removeTerm(i)}
                className="shrink-0 p-0.5 rounded hover:bg-gray-200 transition-colors">
                <X className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <input type="text" value={newTerm} onChange={e => setNewTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTerm())}
              placeholder={placeholder ?? (t as unknown as Record<string,string>)['term_placeholder'] ?? 'Add a term…'}
              className={`${inputCls} flex-1`} />
            <button type="button" onClick={addTerm}
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> {t.add_term}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
