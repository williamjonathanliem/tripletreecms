import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeacherContext } from '@/lib/teacher'

function buildHtml(title: string, body: string, recipientType: 'staff' | 'parents', senderName?: string) {
  const headerColor = recipientType === 'parents' ? '#1E8449' : '#1A5276'
  const headerSub   = recipientType === 'parents'
    ? `Notice from ${senderName ?? 'Triple Tree Enrichment Centre'}`
    : 'Staff Announcement'
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:${headerColor};padding:28px 32px">
      <p style="margin:0;color:#fff;font-size:18px;font-weight:700">Triple Tree Enrichment Centre</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px">${headerSub}</p>
    </div>
    <div style="padding:32px">
      <p style="margin:0 0 16px;font-size:17px;font-weight:700;color:#111827">${title}</p>
      <div style="color:#374151;font-size:14px;line-height:1.75;white-space:pre-line">${body.replace(/\n/g, '<br>')}</div>
    </div>
    <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:12px;color:#9CA3AF">This message was sent via Triple Tree CMS. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const ctx = await getTeacherContext()
  if (!ctx || ctx.role !== 'hr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 })
  }

  const { title, body, sendToStaff, sendToParents, senderName } = await req.json() as {
    title: string; body: string; sendToStaff: boolean; sendToParents: boolean; senderName?: string
  }
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Title and body required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const fromEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER!
  const fromName  = senderName?.trim() || process.env.SMTP_FROM_NAME || 'Triple Tree Enrichment Centre'
  const transport = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  let staffSent = 0, parentsSent = 0
  const errors: { email: string; reason: string }[] = []

  // ── Send to staff ──────────────────────────────────────────────────────────
  if (sendToStaff) {
    const { data: activeTeachers } = await admin.from('teachers').select('id, name').eq('active', true)
    const teacherIds = new Set((activeTeachers ?? []).map(t => t.id))
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 500 })
    const staffRecipients = users.filter(u => u.email && teacherIds.has(u.id))

    const staffResults = await Promise.allSettled(
      staffRecipients.map(u =>
        transport.sendMail({
          from:    `"${fromName}" <${fromEmail}>`,
          to:      u.email!,
          subject: `[Announcement] ${title}`,
          html:    buildHtml(title, body, 'staff'),
          text:    `${title}\n\n${body}`,
        })
      )
    )
    staffSent = staffResults.filter(r => r.status === 'fulfilled').length
    staffResults.forEach((r, i) => {
      if (r.status === 'rejected')
        errors.push({ email: staffRecipients[i]?.email ?? '', reason: (r as PromiseRejectedResult).reason?.message ?? 'Unknown' })
    })
  }

  // ── Send to parents ────────────────────────────────────────────────────────
  if (sendToParents) {
    const { data: students } = await admin
      .from('students')
      .select('parent_email')
      .not('parent_email', 'is', null)

    // Deduplicate — one parent may have multiple children
    const uniqueParentEmails = [...new Set((students ?? []).map(s => s.parent_email as string).filter(Boolean))]

    const parentResults = await Promise.allSettled(
      uniqueParentEmails.map(email =>
        transport.sendMail({
          from:    `"${fromName}" <${fromEmail}>`,
          to:      email,
          subject: title,
          html:    buildHtml(title, body, 'parents', senderName),
          text:    `${title}\n\n${body}`,
        })
      )
    )
    parentsSent = parentResults.filter(r => r.status === 'fulfilled').length
    parentResults.forEach((r, i) => {
      if (r.status === 'rejected')
        errors.push({ email: uniqueParentEmails[i] ?? '', reason: (r as PromiseRejectedResult).reason?.message ?? 'Unknown' })
    })
  }

  return NextResponse.json({ staffSent, parentsSent, errors })
}
