import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeacherContext } from '@/lib/teacher'
import { buildEmail } from '@/lib/email-template'
import { getCentreSettings } from '@/lib/centre-settings'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const ctx = await getTeacherContext()
  if (!ctx || ctx.role !== 'hr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 })
  }

  const { title, body, sendToStaff, sendToParents, senderName, parentEmails } = await req.json() as {
    title: string; body: string; sendToStaff: boolean; sendToParents: boolean; senderName?: string; parentEmails?: string[]
  }
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Title and body required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const settings = await getCentreSettings()

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

  try {
    // ── Send to staff ────────────────────────────────────────────────────────
    if (sendToStaff) {
      const { data: activeTeachers } = await admin.from('teachers').select('id, name').eq('active', true)
      const teacherIds = new Set((activeTeachers ?? []).map(t => t.id))
      const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 500 })
      const staffRecipients = users.filter(u => u.email && teacherIds.has(u.id))

      // Build HTML once, send to all
      const staffHtml = buildEmail({ type: 'staff-notice', title, body, senderName, settings })
      const staffText = `${title}\n\n${body}`

      const BATCH = 5
      for (let i = 0; i < staffRecipients.length; i += BATCH) {
        const batch = staffRecipients.slice(i, i + BATCH)
        const batchResults = await Promise.allSettled(
          batch.map(u =>
            transport.sendMail({
              from:    `"${fromName}" <${fromEmail}>`,
              to:      u.email!,
              subject: `[Announcement] ${title}`,
              html:    staffHtml,
              text:    staffText,
            })
          )
        )
        staffSent += batchResults.filter(r => r.status === 'fulfilled').length
        batchResults.forEach((r, j) => {
          if (r.status === 'rejected')
            errors.push({ email: batch[j]?.email ?? '', reason: (r as PromiseRejectedResult).reason?.message ?? 'Unknown' })
        })
      }
    }

    // ── Send to parents ──────────────────────────────────────────────────────
    if (sendToParents) {
      let uniqueParentEmails: string[]
      if (parentEmails && parentEmails.length > 0) {
        uniqueParentEmails = parentEmails
      } else {
        const { data: students } = await admin
          .from('students')
          .select('parent_email')
          .not('parent_email', 'is', null)
        uniqueParentEmails = Array.from(new Set((students ?? []).map(s => s.parent_email as string).filter(Boolean)))
      }

      if (uniqueParentEmails.length === 0) {
        return NextResponse.json({ error: 'No parent emails found' }, { status: 400 })
      }

      // Build HTML once, send to all
      const parentHtml = buildEmail({ type: 'parent-notice', title, body, senderName, settings })
      const plainText  = `${title}\n\n${body}`

      // Send in batches of 5 — avoids rate limits while still being fast
      const BATCH = 5
      for (let i = 0; i < uniqueParentEmails.length; i += BATCH) {
        const batch = uniqueParentEmails.slice(i, i + BATCH)
        const batchResults = await Promise.allSettled(
          batch.map(email =>
            transport.sendMail({
              from:    `"${fromName}" <${fromEmail}>`,
              to:      email,
              subject: title,
              html:    parentHtml,
              text:    plainText,
            })
          )
        )
        parentsSent += batchResults.filter(r => r.status === 'fulfilled').length
        batchResults.forEach((r, j) => {
          if (r.status === 'rejected')
            errors.push({ email: batch[j] ?? '', reason: (r as PromiseRejectedResult).reason?.message ?? 'Unknown' })
        })
      }

      if (parentsSent === 0 && errors.length > 0) {
        return NextResponse.json({
          error: `All sends failed: ${errors[0].reason}`,
          errors,
        }, { status: 500 })
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Send failed: ${msg}` }, { status: 500 })
  }

  return NextResponse.json({ staffSent, parentsSent, errors })
}
