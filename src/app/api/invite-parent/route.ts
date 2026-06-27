import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeacherContext } from '@/lib/teacher'

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

  // Block inviting an email that belongs to a teacher (use admin to bypass RLS)
  const { data: existingTeacher } = await admin
    .from('teachers')
    .select('id, name')
    .eq('email', normalizedEmail)
    .maybeSingle()

  console.log('[invite-parent] teacher check for', normalizedEmail, '→', existingTeacher)

  if (existingTeacher) {
    return NextResponse.json(
      { error: `${normalizedEmail} is already registered as a staff member. Use a different email for the parent account.` },
      { status: 400 }
    )
  }

  // Save parent_email to the student record
  const { error: updateError } = await supabase
    .from('students')
    .update({ parent_email: normalizedEmail })
    .eq('id', studentId)

  if (updateError) {
    console.error('[invite-parent] update error:', updateError)
    return NextResponse.json({ error: `Could not save email: ${updateError.message}` }, { status: 500 })
  }

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    'http://localhost:3000'

  const redirectTo = `${appUrl}/auth/callback?next=/set-password`

  // Try invite first (works for new accounts)
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(normalizedEmail, {
    redirectTo,
    data: { role: 'parent' },
  })

  if (!inviteError) {
    return NextResponse.json({ ok: true, method: 'invite' })
  }

  // If the account already exists, send a magic link so they can log in directly
  const alreadyRegistered =
    inviteError.message.toLowerCase().includes('already been registered') ||
    inviteError.message.toLowerCase().includes('already registered') ||
    inviteError.message.toLowerCase().includes('user already exists')

  if (alreadyRegistered) {
    const { error: magicError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: { redirectTo: `${appUrl}/auth/callback?next=/portal` },
    })

    if (magicError) {
      console.error('[invite-parent] magic link error:', magicError)
      return NextResponse.json({
        ok: true,
        method: 'existing',
        note: 'Account already exists — parent can log in at /parent-login',
      })
    }

    return NextResponse.json({ ok: true, method: 'magic' })
  }

  console.error('[invite-parent] invite error:', inviteError)
  return NextResponse.json({ error: inviteError.message }, { status: 500 })
}
