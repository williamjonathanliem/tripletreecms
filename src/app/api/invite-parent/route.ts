import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeacherContext } from '@/lib/teacher'
import { getAppUrl } from '@/lib/app-url'

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

function buildParentEmail(opts: {
  inviteUrl: string
  studentName: string
  fromName: string
}) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#1E8449;padding:28px 32px">
      <p style="margin:0;color:#fff;font-size:18px;font-weight:700">Triple Tree Enrichment Centre</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px">Parent Portal Invitation</p>
    </div>
    <div style="padding:32px;color:#374151;font-size:14px;line-height:1.7">
      <p>Dear Parent,</p>
      <p>You have been invited to access the Triple Tree Parent Portal to track <strong>${opts.studentName}</strong>'s progress, schedule, attendance, and fee status.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${opts.inviteUrl}" style="display:inline-block;background:#1E8449;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px">
          Set Up My Account
        </a>
      </div>
      <p style="color:#9CA3AF;font-size:12px">This link expires in 24 hours. If you didn't expect this, you can ignore this email.</p>
    </div>
    <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
      <p style="margin:0;font-size:12px;color:#9CA3AF">Sent by ${opts.fromName}</p>
    </div>
  </div>
</body>
</html>`

  const text = `Dear Parent,\n\nYou've been invited to the Triple Tree Parent Portal to track ${opts.studentName}'s progress.\n\nSet up your account here: ${opts.inviteUrl}\n\nThis link expires in 24 hours.`

  return { html, text }
}

export async function POST(req: NextRequest) {
  const ctx = await getTeacherContext()
  if (!ctx || ctx.role !== 'hr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { studentId, email } = await req.json()
  if (!studentId || !email) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const normalizedEmail = email.trim().toLowerCase()
  const supabase = await createClient()
  const admin = createAdminClient()
  const appUrl = getAppUrl()

  // Block inviting a teacher email
  const { data: existingTeacher } = await admin
    .from('teachers')
    .select('id, name')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (existingTeacher) {
    return NextResponse.json(
      { error: `${normalizedEmail} is already registered as a staff member. Use a different email for the parent account.` },
      { status: 400 }
    )
  }

  // Get student name for the email
  const { data: student } = await admin
    .from('students')
    .select('name')
    .eq('id', studentId)
    .maybeSingle()

  const studentName = student?.name ?? 'your child'

  // Save parent_email to the student record
  const { error: updateError } = await supabase
    .from('students')
    .update({ parent_email: normalizedEmail })
    .eq('id', studentId)

  if (updateError) {
    return NextResponse.json({ error: `Could not save email: ${updateError.message}` }, { status: 500 })
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP not configured' }, { status: 500 })
  }

  const fromEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER!
  const fromName  = process.env.SMTP_FROM_NAME ?? 'Triple Tree Enrichment Centre'

  // Generate invite link (no email from Supabase)
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: normalizedEmail,
  })

  if (linkError) {
    // If already registered, send a login link instead
    const alreadyExists =
      linkError.message.toLowerCase().includes('already') ||
      linkError.message.toLowerCase().includes('registered')

    if (alreadyExists) {
      return NextResponse.json({ ok: true, method: 'existing', note: 'Account already exists — parent can log in at /parent-login' })
    }

    return NextResponse.json({ error: linkError.message }, { status: 400 })
  }

  // The auth.users INSERT trigger may auto-create a teachers row for the new user.
  // Remove it immediately so the parent is not treated as staff.
  if (linkData.user?.id) {
    await admin.from('teachers').delete().eq('id', linkData.user.id)
  }

  const tokenHash = linkData.properties.hashed_token
  const inviteUrl = `${appUrl}/set-password?token_hash=${tokenHash}&type=invite`
  const { html, text } = buildParentEmail({ inviteUrl, studentName, fromName })

  try {
    const transport = createTransport()
    await transport.sendMail({
      from:    `"${fromName}" <${fromEmail}>`,
      to:      normalizedEmail,
      subject: `You're invited to the Triple Tree Parent Portal`,
      html,
      text,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Parent record saved but email failed: ${msg}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true, method: 'invite' })
}
