import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeacherContext } from '@/lib/teacher'
import { buildEmail } from '@/lib/email-template'
import { getCentreSettings } from '@/lib/centre-settings'

export const maxDuration = 60

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function buildFeeEmail(opts: {
  studentName: string
  parentEmail: string
  dueDate: string | null
  feeNote: string | null
  feeAmount: string | null
  subject: string
  templateSubject: string
  templateBody: string
  fromName: string
  fromEmail: string
  settings?: import('@/lib/centre-settings').CentreSettings
}) {
  const amountStr = opts.feeAmount
    ? `RM ${parseFloat(opts.feeAmount).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : ''

  const body = opts.templateBody
    .replace(/\{\{student\}\}/g, opts.studentName)
    .replace(/\{\{due_date\}\}/g, opts.dueDate
      ? new Date(opts.dueDate + 'T00:00:00').toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'soon')
    .replace(/\{\{note\}\}/g, opts.feeNote ?? '')
    .replace(/\{\{subject\}\}/g, opts.subject)
    .replace(/\{\{amount\}\}/g, amountStr)

  const emailSubject = opts.templateSubject
    .replace(/\{\{student\}\}/g, opts.studentName)
    .replace(/\{\{amount\}\}/g, amountStr)

  const html = buildEmail({ type: 'fee-reminder', title: emailSubject, body, senderName: opts.fromName, settings: opts.settings })

  return { subject: emailSubject, html, text: body }
}

export async function POST(req: NextRequest) {
  const ctx = await getTeacherContext()
  if (!ctx || ctx.role !== 'hr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { studentIds, templateSubject, templateBody } = await req.json()

  if (!templateSubject?.trim() || !templateBody?.trim()) {
    return NextResponse.json({ error: 'Template subject and body are required' }, { status: 400 })
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP is not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS to your environment.' }, { status: 500 })
  }

  const admin = createAdminClient()

  // Fetch selected (or all unpaid/partial with parent_email and due date)
  let query = admin
    .from('students')
    .select('id, name, subject, fee_status, fee_due_date, fee_note, fee_amount, parent_email')
    .not('parent_email', 'is', null)
    .in('fee_status', ['unpaid', 'partial'])

  if (studentIds && studentIds.length > 0) {
    query = query.in('id', studentIds)
  }

  const { data: students, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!students || students.length === 0) {
    return NextResponse.json({ sent: 0, skipped: 0, errors: [] })
  }

  const fromEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER!
  const fromName  = process.env.SMTP_FROM_NAME ?? 'Triple Tree Enrichment Centre'
  const transport = createTransport()
  const settings  = await getCentreSettings()

  let sent = 0
  const errors: { email: string | null; reason: string }[] = []

  const BATCH = 5
  for (let i = 0; i < students.length; i += BATCH) {
    const batch = students.slice(i, i + BATCH)
    const batchResults = await Promise.allSettled(
      batch.map(async (s) => {
        const { subject: emailSubject, html, text } = buildFeeEmail({
          studentName:     s.name,
          parentEmail:     s.parent_email!,
          dueDate:         s.fee_due_date,
          feeNote:         s.fee_note,
          feeAmount:       (s as Record<string, unknown>).fee_amount as string | null ?? null,
          subject:         s.subject,
          templateSubject,
          templateBody,
          fromName,
          fromEmail,
          settings,
        })
        await transport.sendMail({
          from:    `"${fromName}" <${fromEmail}>`,
          to:      s.parent_email!,
          subject: emailSubject,
          html,
          text,
        })
      })
    )
    sent += batchResults.filter(r => r.status === 'fulfilled').length
    batchResults.forEach((r, j) => {
      if (r.status === 'rejected')
        errors.push({ email: batch[j]?.parent_email ?? null, reason: (r as PromiseRejectedResult).reason?.message ?? 'Unknown error' })
    })
  }

  if (sent === 0 && errors.length > 0) {
    return NextResponse.json({ error: `All sends failed: ${errors[0].reason}`, errors }, { status: 500 })
  }

  return NextResponse.json({ sent, skipped: students.length - sent, errors })
}
