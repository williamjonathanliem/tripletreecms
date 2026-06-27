import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppUrl } from '@/lib/app-url'
import nodemailer from 'nodemailer'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const APP_URL      = getAppUrl()

export async function POST(request: Request) {
  const cookieStore = await cookies()

  const supabase = createServerClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
      },
    },
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: caller } = await supabase.from('teachers').select('role').eq('id', user.id).single()
  if (caller?.role !== 'hr') {
    return NextResponse.json({ error: 'Only HR admins can invite staff' }, { status: 403 })
  }

  const { name, email, role, subjects } = await request.json()
  if (!name || !email) return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })

  const admin = createAdminClient()

  // Generate invite link (no email sent by Supabase)
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email,
  })

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 400 })
  }

  const userId      = linkData.user.id
  const tokenHash   = linkData.properties.hashed_token
  const inviteUrl   = `${APP_URL}/set-password?token_hash=${tokenHash}&type=invite`

  // Insert teacher row first
  const { error: dbError } = await admin.from('teachers').upsert(
    { id: userId, name, email, role, subjects, active: true },
    { onConflict: 'id' }
  )
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  // Send invite email via our own SMTP
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: 'SMTP not configured — add SMTP_HOST, SMTP_USER, SMTP_PASS to your environment.' }, { status: 500 })
  }

  const transport = nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  const fromEmail = process.env.SMTP_FROM ?? process.env.SMTP_USER!
  const fromName  = process.env.SMTP_FROM_NAME ?? 'Triple Tree Enrichment Centre'

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#1A5276;padding:28px 32px">
      <p style="margin:0;color:#fff;font-size:18px;font-weight:700">Triple Tree Enrichment Centre</p>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px">Staff Invitation</p>
    </div>
    <div style="padding:32px;color:#374151;font-size:14px;line-height:1.7">
      <p>Hi <strong>${name}</strong>,</p>
      <p>You've been invited to join the Triple Tree CMS as a <strong>${role}</strong>. Click the button below to set your password and get started.</p>
      <div style="text-align:center;margin:28px 0">
        <a href="${inviteUrl}" style="display:inline-block;background:#1A5276;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px">
          Accept Invitation &amp; Set Password
        </a>
      </div>
      <p style="color:#9CA3AF;font-size:12px">This link expires in 24 hours. If you didn't expect this invitation, you can ignore this email.</p>
    </div>
  </div>
</body>
</html>`

  try {
    await transport.sendMail({
      from:    `"${fromName}" <${fromEmail}>`,
      to:      email,
      subject: `You're invited to Triple Tree CMS`,
      html,
      text: `Hi ${name},\n\nYou've been invited to join Triple Tree CMS as a ${role}.\n\nSet your password here: ${inviteUrl}\n\nThis link expires in 24 hours.`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Teacher created but email failed: ${msg}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
