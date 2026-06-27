import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const APP_URL      = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

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

  // Send invite email via Supabase Auth
  const inviteRes = await fetch(`${SUPABASE_URL}/auth/v1/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email,
      redirect_to: `${APP_URL}/set-password`,
    }),
  })

  const inviteBody = await inviteRes.json().catch(() => ({}))
  console.log('[invite API] status:', inviteRes.status, 'body:', JSON.stringify(inviteBody))

  if (!inviteRes.ok) {
    return NextResponse.json(
      { error: inviteBody.msg ?? inviteBody.message ?? `Invite failed (${inviteRes.status})` },
      { status: inviteRes.status }
    )
  }

  const invited = inviteBody
  const userId: string = invited.id
  console.log('[invite API] invited user id:', userId, 'email:', invited.email)

  const admin = createAdminClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: dbError } = await admin.from('teachers').upsert(
    { id: userId, name, email, role, subjects, active: true },
    { onConflict: 'id' }
  )

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
