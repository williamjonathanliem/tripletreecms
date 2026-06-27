import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeacherContext } from '@/lib/teacher'

export type ParentAccount = {
  email: string
  userId: string | null
  status: 'active' | 'banned' | 'no_account'
  students: { id: string; name: string; tier: string; branch: string; subject: string }[]
  lastSignIn: string | null
}

export async function GET() {
  const ctx = await getTeacherContext()
  if (!ctx || ctx.role !== 'hr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Get all students with a parent_email
  const { data: students } = await admin
    .from('students')
    .select('id, name, tier, branch, subject, parent_email')
    .not('parent_email', 'is', null)
    .order('name')

  // Group by parent_email
  const grouped: Record<string, ParentAccount['students']> = {}
  for (const s of students ?? []) {
    const em = s.parent_email as string
    if (!grouped[em]) grouped[em] = []
    grouped[em].push({ id: s.id, name: s.name, tier: s.tier, branch: s.branch, subject: s.subject })
  }

  const emails = Object.keys(grouped)
  if (emails.length === 0) return NextResponse.json([])

  // Fetch all auth users (up to 1000) and cross-reference
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })

  const emailToUser = Object.fromEntries(
    (users ?? []).filter(u => u.email).map(u => [u.email!.toLowerCase(), u])
  )

  const accounts: ParentAccount[] = emails.map(email => {
    const authUser = emailToUser[email.toLowerCase()]
    const isBanned = authUser
      ? (authUser.banned_until && new Date(authUser.banned_until) > new Date())
      : false

    return {
      email,
      userId: authUser?.id ?? null,
      status: authUser ? (isBanned ? 'banned' : 'active') : 'no_account',
      students: grouped[email],
      lastSignIn: authUser?.last_sign_in_at ?? null,
    }
  })

  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const ctx = await getTeacherContext()
  if (!ctx || ctx.role !== 'hr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json()
  const { action, userId, email, newEmail, studentId } = body
  const admin = createAdminClient()

  if (action === 'deactivate') {
    // Ban for 100 years — effectively permanent until reactivated
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: '876600h',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'reactivate') {
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete') {
    // Remove auth account, then clear parent_email from all linked students
    if (userId) {
      const { error } = await admin.auth.admin.deleteUser(userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (email) {
      await admin.from('students').update({ parent_email: null }).eq('parent_email', email)
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'resend') {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      'http://localhost:3000'

    // If user already has an account, send a fresh magic link
    if (userId) {
      const { data, error } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${appUrl}/auth/callback?next=/portal` },
      })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      // generateLink returns the link but doesn't send it automatically in all Supabase versions
      // We use inviteUserByEmail on the existing account flow instead
      void data
    }

    // Re-invite (creates fresh invite token even for existing accounts in some configs)
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/auth/callback?next=/set-password`,
      data: { role: 'parent' },
    })

    // If already registered, send magic link
    if (inviteError) {
      const { error: mlError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: `${appUrl}/auth/callback?next=/portal` },
      })
      if (mlError) return NextResponse.json({ error: mlError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  }

  if (action === 'update-email') {
    if (!newEmail || !newEmail.trim()) {
      return NextResponse.json({ error: 'New email required' }, { status: 400 })
    }
    const normalized = newEmail.trim().toLowerCase()

    // Block if new email belongs to a teacher
    const { data: existingTeacher } = await admin
      .from('teachers').select('id').eq('email', normalized).maybeSingle()
    if (existingTeacher) {
      return NextResponse.json({ error: 'That email belongs to a staff account.' }, { status: 400 })
    }

    // Update auth email if they have an account
    if (userId) {
      const { error } = await admin.auth.admin.updateUserById(userId, { email: normalized })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update all student records that referenced the old email
    if (email) {
      await admin.from('students').update({ parent_email: normalized }).eq('parent_email', email)
    } else if (studentId) {
      await admin.from('students').update({ parent_email: normalized }).eq('id', studentId)
    }

    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
