import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeacherContext } from '@/lib/teacher'

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

function buildEmail(opts: {
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

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#1E8449;padding:28px 32px">
      <p style="margin:0;color:#fff;font-size:18px;font-weight:700">Triple Tree Enrichment Centre</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px">Fee Payment Reminder</p>
    </div>
    <div style="padding:32px;color:#374151;font-size:14px;line-height:1.7;white-space:pre-line">${body.replace(/\n/g, '<br>')}</div>
    <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:12px;color:#9CA3AF">This is an automated message from Triple Tree CMS. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`

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

  const results = await Promise.allSettled(
    students.map(async (s) => {
      const { subject: emailSubject, html, text } = buildEmail({
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
      })

      await transport.sendMail({
        from:    `"${fromName}" <${fromEmail}>`,
        to:      s.parent_email!,
        subject: emailSubject,
        html,
        text,
      })

      return s.parent_email
    })
  )

  const sent   = results.filter(r => r.status === 'fulfilled').length
  const errors = results
    .filter(r => r.status === 'rejected')
    .map((r, i) => ({ email: students[i]?.parent_email, reason: (r as PromiseRejectedResult).reason?.message ?? 'Unknown error' }))

  return NextResponse.json({ sent, skipped: students.length - sent, errors })
}
