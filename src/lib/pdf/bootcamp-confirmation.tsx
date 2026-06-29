import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import path from 'path'

Font.register({
  family: 'NotoSansSC',
  src: path.join(process.cwd(), 'public', 'fonts', 'NotoSansSC-Regular.otf'),
})

// ── Types ──────────────────────────────────────────────────────────────────

export type ConfirmationMode = 'bootcamp' | 'class' | 'workshop'
export type BootcampType = 'coding' | 'english' | 'math'
export type FeeType = 'standard' | 'early_bird'
export type PaymentStatus = 'paid' | 'deposit' | 'pending'

export type ConfirmationData = {
  // Mode: 'bootcamp' (default for backward compat), 'class', 'workshop'
  mode?: ConfirmationMode

  // Bootcamp-specific (used when mode === 'bootcamp')
  bootcamp_type?: BootcampType
  age_group?: string
  fee_type?: FeeType

  // Universal program override (required for class/workshop, optional for bootcamp)
  program_name?: string     // full display name shown on PDF badge
  program_color?: string    // hex color for badge background
  fee_amount?: number       // total fee amount (overrides bootcamp config)
  fee_label?: string        // label for the fee row (e.g. "Monthly Tuition Fee")
  duration_label?: string   // e.g. "10 Days · 2 Hrs/Day · 20 Total Hrs" or "Every Tue & Thu"
  venue?: string            // override venue string
  custom_terms?: string[]   // override T&C bullet points

  // Student info (all shared)
  student_name: string
  student_age?: string
  parent_name?: string
  contact?: string
  email?: string

  // Dates & time
  start_date: string
  end_date?: string
  class_time?: string

  // Payment
  payment_status: PaymentStatus
  amount_paid?: string

  // Meta
  confirmation_number: string
  issue_date: string
  issued_by: string
  lang?: 'en' | 'zh'
  logo_base64?: string | null
}

// ── Translations ────────────────────────────────────────────────────────────

const PDF_T = {
  en: {
    title: 'ENROLLMENT CONFIRMATION',
    student_info: 'STUDENT INFORMATION',
    program_details: 'PROGRAM DETAILS',
    fee_summary: 'FEE SUMMARY',
    terms_title: 'TERMS & CONDITIONS',
    parent_sig: 'PARENT / GUARDIAN ACKNOWLEDGEMENT',
    authorized: 'AUTHORIZED BY TRIPLE TREE ENRICHMENT CENTRE',
    student_name: 'Student Name',
    age: 'Age',
    age_group: 'Age Group',
    parent: 'Parent / Guardian',
    contact: 'Contact',
    email: 'Email',
    program: 'Program',
    start_date: 'Start Date',
    end_date: 'End Date',
    class_time: 'Class Time',
    schedule: 'Schedule',
    duration: 'Duration',
    venue: 'Venue',
    fee_standard: 'Program Fee (Standard)',
    fee_early_bird: 'Program Fee (Early Bird Promotion)',
    amount_paid: 'Amount Paid',
    balance_due: 'Balance Due',
    status_paid: 'FULLY PAID',
    status_deposit: 'DEPOSIT PAID',
    status_pending: 'PENDING',
    ref: 'Reference No:',
    issue_date: 'Issue Date:',
    years_old: 'years old',
    days: 'Days',
    hrs_day: 'Hrs/Day',
    total_hrs: 'Total Hours',
    venue_val: 'L2-12, 1 Mont Kiara, Mont Kiara, KL',
    signature: 'Signature',
    name_line: 'Name: ___________________________',
    date_line: 'Date: ____________________________',
    issued_by: 'Issued by:',
    stamp: 'Stamp & Authorized Signature',
    bootcamp_terms: [
      'Fees paid are non-refundable once enrollment is confirmed.',
      'Students are encouraged to attend all 10 days to ensure full learning continuity.',
      'Please bring your own laptop or device (Coding Bootcamp participants).',
      'Triple Tree Enrichment Centre reserves the right to reschedule sessions due to unforeseen circumstances.',
      'A certificate of completion will be awarded upon finishing the program.',
    ],
    class_terms: [
      'Tuition fees are due on the first week of each enrolled month.',
      'Three days\' notice is required for cancellations; missed sessions may not be rescheduled.',
      'Students are expected to maintain regular attendance for optimal progress.',
      'Triple Tree Enrichment Centre reserves the right to adjust schedules due to unforeseen circumstances.',
      'Learning materials and resources are included in the monthly tuition fee.',
    ],
    workshop_terms: [
      'Registration fees are non-refundable once confirmed.',
      'Please arrive 10 minutes before the workshop starts.',
      'All required materials will be provided unless otherwise stated.',
      'Triple Tree Enrichment Centre reserves the right to cancel or reschedule due to unforeseen circumstances.',
      'A certificate of participation will be awarded upon completion.',
    ],
    footer_left: 'Triple Tree Enrichment Centre  ·  L2-12, 1 Mont Kiara, KL  ·  +6017-494 3238',
    footer_right: 'This is an official enrollment confirmation document. Ref:',
  },
  zh: {
    title: '入学确认书',
    student_info: '学生资料',
    program_details: '课程详情',
    fee_summary: '费用摘要',
    terms_title: '条款与条件',
    parent_sig: '家长/监护人确认',
    authorized: '三树丰富教育中心授权',
    student_name: '学生姓名',
    age: '年龄',
    age_group: '年龄组',
    parent: '家长/监护人',
    contact: '联系电话',
    email: '电子邮件',
    program: '课程',
    start_date: '开始日期',
    end_date: '结束日期',
    class_time: '上课时间',
    schedule: '上课时间表',
    duration: '课程时长',
    venue: '上课地点',
    fee_standard: '课程费用（标准）',
    fee_early_bird: '课程费用（早鸟优惠）',
    amount_paid: '已付金额',
    balance_due: '待付余额',
    status_paid: '全额付清',
    status_deposit: '已付定金',
    status_pending: '待付款',
    ref: '参考编号：',
    issue_date: '发出日期：',
    years_old: '岁',
    days: '天',
    hrs_day: '小时/天',
    total_hrs: '共小时',
    venue_val: 'L2-12, 1 Mont Kiara, Mont Kiara, 吉隆坡',
    signature: '签名',
    name_line: '姓名：___________________________',
    date_line: '日期：____________________________',
    issued_by: '发出者：',
    stamp: '盖章及授权签名',
    bootcamp_terms: [
      '报名确认后，所缴费用不予退还。',
      '鼓励学生出席全部10天课程，以确保学习效果。',
      '请自备笔记本电脑或设备（编程训练营学员）。',
      '三树丰富教育中心保留因不可预见情况调整课程时间的权利。',
      '完成课程后将颁发结业证书。',
    ],
    class_terms: [
      '每月学费须在报名月份的第一周缴清。',
      '取消课程须提前三天通知；已缺席课程可能无法补课。',
      '学生须保持正常出席率以确保学习进度。',
      '三树丰富教育中心保留因不可预见情况调整课程时间的权利。',
      '月费已包含学习材料及资源。',
    ],
    workshop_terms: [
      '确认报名后，所缴费用不予退还。',
      '请提前10分钟到达工作坊现场。',
      '所需材料将由主办方提供，另有说明者除外。',
      '三树丰富教育中心保留因不可预见情况取消或调整活动的权利。',
      '完成工作坊后将颁发参与证书。',
    ],
    footer_left: 'Triple Tree Enrichment Centre  ·  L2-12, 1 Mont Kiara, KL  ·  +6017-494 3238',
    footer_right: '此为官方入学确认书。参考编号：',
  },
}

// ── Bootcamp Config ─────────────────────────────────────────────────────────

const BOOTCAMP_CONFIG: Record<BootcampType, {
  name_en: string; name_zh: string; color: string
  hours: string; hours_per_day: string; days: string
  standard: number; early_bird: number
}> = {
  coding: {
    name_en: 'Summer Coding Bootcamp 2026',
    name_zh: '2026暑期编程训练营',
    color: '#1A5276',
    hours: '20', hours_per_day: '2', days: '10',
    standard: 2600, early_bird: 2380,
  },
  english: {
    name_en: 'Summer English Bootcamp 2026',
    name_zh: '2026暑期英语训练营',
    color: '#B7770D',
    hours: '25', hours_per_day: '2.5', days: '10',
    standard: 2500, early_bird: 2280,
  },
  math: {
    name_en: 'Summer Math Bootcamp 2026',
    name_zh: '2026暑期数学训练营',
    color: '#1E8449',
    hours: '20', hours_per_day: '2', days: '10',
    standard: 2200, early_bird: 1980,
  },
}

const GREEN  = '#1E8449'
const DARK   = '#1C2833'
const GRAY   = '#717D7E'
const LIGHT_GRAY = '#F2F3F4'
const BORDER = '#D5D8DC'

// ── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: { fontSize: 9, color: DARK, paddingBottom: 40 },

  header: { backgroundColor: GREEN, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36 },
  headerTitle: { color: 'white', fontSize: 13, fontFamily: 'Helvetica-Bold' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 8, marginTop: 2, fontFamily: 'NotoSansSC' },
  headerRight: { alignItems: 'flex-end' },
  headerAddr: { color: 'rgba(255,255,255,0.8)', fontSize: 7.5, textAlign: 'right', lineHeight: 1.5 },

  titleBand: { paddingHorizontal: 24, paddingVertical: 14, borderBottom: `1pt solid ${BORDER}` },
  confirmTitle: { fontSize: 20, letterSpacing: 1.5, color: DARK },
  bootcampBadge: { marginTop: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, alignSelf: 'flex-start' },
  bootcampBadgeText: { color: 'white', fontSize: 9, letterSpacing: 0.5 },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  refText: { fontSize: 8, color: GRAY },
  refValue: { fontSize: 8, color: DARK },

  content: { paddingHorizontal: 24, paddingTop: 16 },

  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoBox: { flex: 1, border: `1pt solid ${BORDER}`, borderRadius: 4, overflow: 'hidden' },
  infoBoxHeader: { backgroundColor: LIGHT_GRAY, paddingHorizontal: 10, paddingVertical: 6, borderBottom: `1pt solid ${BORDER}` },
  infoBoxHeaderText: { fontSize: 8, letterSpacing: 0.5, color: GRAY },
  infoBoxBody: { padding: 10, gap: 5 },
  infoLine: { flexDirection: 'row', gap: 4 },
  infoLabel: { fontSize: 8, color: GRAY, width: 70, flexShrink: 0 },
  infoValue: { fontSize: 8, flex: 1 },

  feeBox: { border: `1pt solid ${BORDER}`, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  feeHeader: { backgroundColor: LIGHT_GRAY, paddingHorizontal: 10, paddingVertical: 6, borderBottom: `1pt solid ${BORDER}` },
  feeHeaderText: { fontSize: 8, letterSpacing: 0.5, color: GRAY },
  feeBody: { padding: 10 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottom: `1pt solid ${LIGHT_GRAY}` },
  feeLabelText: { fontSize: 8.5, color: DARK },
  feeValueText: { fontSize: 8.5 },
  feeTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6, marginTop: 2 },
  feeTotalLabel: { fontSize: 9, color: DARK },
  feeTotalValue: { fontSize: 9 },
  paidBadge: { backgroundColor: '#EAFAF1', borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  paidBadgeText: { fontSize: 8, color: GREEN },
  pendingBadge: { backgroundColor: '#FEF9E7', borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2 },
  pendingBadgeText: { fontSize: 8, color: '#B7770D' },

  termsBox: { border: `1pt solid ${BORDER}`, borderRadius: 4, overflow: 'hidden', marginBottom: 12 },
  termsHeader: { backgroundColor: LIGHT_GRAY, paddingHorizontal: 10, paddingVertical: 6, borderBottom: `1pt solid ${BORDER}` },
  termsHeaderText: { fontSize: 8, letterSpacing: 0.5, color: GRAY },
  termsBody: { padding: 10, gap: 4 },
  termLine: { flexDirection: 'row', gap: 5 },
  termBullet: { fontSize: 8, color: GREEN, width: 8 },
  termText: { fontSize: 8, color: DARK, flex: 1, lineHeight: 1.4 },

  sigRow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  sigBox: { flex: 1, border: `1pt solid ${BORDER}`, borderRadius: 4, padding: 12 },
  sigLabel: { fontSize: 7.5, color: GRAY, letterSpacing: 0.5, marginBottom: 24 },
  sigLine: { borderBottom: `1pt solid ${DARK}`, marginBottom: 4 },
  sigSub: { fontSize: 7.5, color: GRAY },

  footer: { position: 'absolute', bottom: 16, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', borderTop: `1pt solid ${BORDER}`, paddingTop: 6 },
  footerText: { fontSize: 7, color: GRAY },
})

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(date: string) {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtRM(amount: number) {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Document ───────────────────────────────────────────────────────────────

export function BootcampConfirmationDocument(data: ConfirmationData) {
  const lang    = data.lang ?? 'en'
  const t       = PDF_T[lang]
  const mode    = data.mode ?? 'bootcamp'
  const useNoto = lang === 'zh'
  const fontFamily = useNoto ? 'NotoSansSC' : 'Helvetica'
  const fontBold   = useNoto ? 'NotoSansSC' : 'Helvetica-Bold'

  // ── Resolve program config from mode ──────────────────────────────────────
  let programName: string
  let programColor: string
  let feeAmount: number
  let feeLabelText: string
  let durationText: string | undefined
  let venueText: string
  let terms: string[]

  if (mode === 'bootcamp' && data.bootcamp_type) {
    const cfg    = BOOTCAMP_CONFIG[data.bootcamp_type]
    programName  = lang === 'zh' ? cfg.name_zh : cfg.name_en
    programColor = data.program_color ?? cfg.color
    feeAmount    = data.fee_amount ?? (data.fee_type === 'early_bird' ? cfg.early_bird : cfg.standard)
    feeLabelText = data.fee_label ?? (data.fee_type === 'early_bird' ? t.fee_early_bird : t.fee_standard)
    durationText = data.duration_label ?? (
      lang === 'zh'
        ? `${cfg.days}${t.days} · ${cfg.hours_per_day}${t.hrs_day} · 共${cfg.hours}小时`
        : `${cfg.days} ${t.days} · ${cfg.hours_per_day} ${t.hrs_day} · ${cfg.hours} ${t.total_hrs}`
    )
    venueText    = data.venue ?? t.venue_val
    terms        = data.custom_terms ?? t.bootcamp_terms
  } else {
    programName  = data.program_name ?? '—'
    programColor = data.program_color ?? '#1A5276'
    feeAmount    = data.fee_amount ?? 0
    feeLabelText = data.fee_label ?? (mode === 'workshop' ? 'Workshop Fee' : 'Program Fee')
    durationText = data.duration_label
    venueText    = data.venue ?? t.venue_val
    terms        = data.custom_terms ?? (mode === 'workshop' ? t.workshop_terms : t.class_terms)
  }

  const paidAmount = data.amount_paid
    ? parseFloat(data.amount_paid)
    : (data.payment_status === 'paid' ? feeAmount : 0)
  const balance = Math.max(0, feeAmount - paidAmount)

  const paymentLabel =
    data.payment_status === 'paid'    ? t.status_paid :
    data.payment_status === 'deposit' ? t.status_deposit :
    t.status_pending

  const ageText = data.student_age
    ? (lang === 'zh' ? `${data.student_age}${t.years_old}` : `${data.student_age} ${t.years_old}`)
    : '—'

  const studentFields: [string, string][] = [
    [t.student_name, data.student_name || '—'],
    [t.age, ageText],
    ...(data.age_group ? [[t.age_group, data.age_group] as [string, string]] : []),
    [t.parent, data.parent_name || '—'],
    [t.contact, data.contact || '—'],
    [t.email, data.email || '—'],
  ]

  const programFields: [string, string][] = [
    [t.program, programName],
    [t.start_date, fmt(data.start_date)],
    ...(data.end_date ? [[t.end_date, fmt(data.end_date)] as [string, string]] : []),
    ...(data.class_time ? [[(mode === 'class' ? t.schedule : t.class_time), data.class_time] as [string, string]] : []),
    ...(durationText ? [[t.duration, durationText] as [string, string]] : []),
    [t.venue, venueText],
  ]

  return (
    <Document title={`Enrollment Confirmation – ${data.student_name}`} author="Triple Tree Enrichment Centre">
      <Page size="A4" style={[s.page, { fontFamily }]}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            {data.logo_base64 && <Image style={s.logo} src={data.logo_base64} />}
            <View>
              <Text style={s.headerTitle}>Triple Tree Enrichment Centre</Text>
              <Text style={s.headerSub}>三树丰富教育中心</Text>
            </View>
          </View>
          <View style={s.headerRight}>
            <Text style={[s.headerAddr, { fontFamily }]}>L2-12, 1 Mont Kiara, Mont Kiara, Kuala Lumpur</Text>
            <Text style={[s.headerAddr, { fontFamily }]}>+6017-494 3238  |  tripletreeenrichment.com</Text>
            <Text style={[s.headerAddr, { fontFamily }]}>tripletreeenrichment@gmail.com</Text>
          </View>
        </View>

        {/* ── Title Band ── */}
        <View style={s.titleBand}>
          <Text style={[s.confirmTitle, { fontFamily: fontBold }]}>{t.title}</Text>
          <View style={[s.bootcampBadge, { backgroundColor: programColor }]}>
            <Text style={[s.bootcampBadgeText, { fontFamily: fontBold }]}>{programName.toUpperCase()}</Text>
          </View>
          <View style={s.refRow}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <Text style={[s.refText, { fontFamily }]}>{t.ref}</Text>
              <Text style={[s.refValue, { fontFamily: fontBold }]}>{data.confirmation_number}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <Text style={[s.refText, { fontFamily }]}>{t.issue_date}</Text>
              <Text style={[s.refValue, { fontFamily: fontBold }]}>{fmt(data.issue_date)}</Text>
            </View>
          </View>
        </View>

        <View style={s.content}>

          {/* ── Student + Program ── */}
          <View style={s.infoRow}>
            <View style={s.infoBox}>
              <View style={s.infoBoxHeader}>
                <Text style={[s.infoBoxHeaderText, { fontFamily: fontBold }]}>{t.student_info}</Text>
              </View>
              <View style={s.infoBoxBody}>
                {studentFields.map(([label, value]) => (
                  <View key={label} style={s.infoLine}>
                    <Text style={[s.infoLabel, { fontFamily }]}>{label}</Text>
                    <Text style={[s.infoValue, { fontFamily: fontBold }]}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.infoBox}>
              <View style={s.infoBoxHeader}>
                <Text style={[s.infoBoxHeaderText, { fontFamily: fontBold }]}>{t.program_details}</Text>
              </View>
              <View style={s.infoBoxBody}>
                {programFields.map(([label, value]) => (
                  <View key={label} style={s.infoLine}>
                    <Text style={[s.infoLabel, { fontFamily }]}>{label}</Text>
                    <Text style={[s.infoValue, { fontFamily: fontBold }]}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── Fee ── */}
          <View style={s.feeBox}>
            <View style={s.feeHeader}>
              <Text style={[s.feeHeaderText, { fontFamily: fontBold }]}>{t.fee_summary}</Text>
            </View>
            <View style={s.feeBody}>
              <View style={s.feeRow}>
                <Text style={[s.feeLabelText, { fontFamily }]}>{feeLabelText}</Text>
                <Text style={[s.feeValueText, { fontFamily: fontBold }]}>{fmtRM(feeAmount)}</Text>
              </View>
              <View style={s.feeRow}>
                <Text style={[s.feeLabelText, { fontFamily }]}>{t.amount_paid}</Text>
                <Text style={[s.feeValueText, { fontFamily: fontBold, color: GREEN }]}>{fmtRM(paidAmount)}</Text>
              </View>
              <View style={s.feeTotal}>
                <Text style={[s.feeTotalLabel, { fontFamily: fontBold }]}>{t.balance_due}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[s.feeTotalValue, { fontFamily: fontBold, color: balance > 0 ? '#B7770D' : GREEN }]}>
                    {fmtRM(balance)}
                  </Text>
                  <View style={balance === 0 ? s.paidBadge : s.pendingBadge}>
                    <Text style={[balance === 0 ? s.paidBadgeText : s.pendingBadgeText, { fontFamily: fontBold }]}>
                      {paymentLabel}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* ── Terms ── */}
          <View style={s.termsBox}>
            <View style={s.termsHeader}>
              <Text style={[s.termsHeaderText, { fontFamily: fontBold }]}>{t.terms_title}</Text>
            </View>
            <View style={s.termsBody}>
              {terms.map((term, i) => (
                <View key={i} style={s.termLine}>
                  <Text style={[s.termBullet, { fontFamily }]}>•</Text>
                  <Text style={[s.termText, { fontFamily }]}>{term}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Signatures ── */}
          <View style={s.sigRow}>
            <View style={s.sigBox}>
              <Text style={[s.sigLabel, { fontFamily: fontBold }]}>{t.parent_sig}</Text>
              <View style={s.sigLine} />
              <Text style={[s.sigSub, { fontFamily }]}>{t.signature}</Text>
              <Text style={[s.sigSub, { fontFamily, marginTop: 10 }]}>{t.name_line}</Text>
              <Text style={[s.sigSub, { fontFamily, marginTop: 6 }]}>{t.date_line}</Text>
            </View>
            <View style={s.sigBox}>
              <Text style={[s.sigLabel, { fontFamily: fontBold }]}>{t.authorized}</Text>
              <Text style={[s.sigSub, { fontFamily, marginBottom: 14 }]}>{t.issued_by} {data.issued_by || '—'}</Text>
              <View style={s.sigLine} />
              <Text style={[s.sigSub, { fontFamily }]}>{t.stamp}</Text>
            </View>
          </View>

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={[s.footerText, { fontFamily }]}>{t.footer_left}</Text>
          <Text style={[s.footerText, { fontFamily }]}>{t.footer_right} {data.confirmation_number}</Text>
        </View>

      </Page>
    </Document>
  )
}
