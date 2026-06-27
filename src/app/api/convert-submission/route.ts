import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

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
  if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: caller } = await supabase.from('teachers').select('role').eq('id', user.id).single()
  if (caller?.role !== 'hr') return NextResponse.json({ error: 'HR only' }, { status: 403 })

  const { submission_id, teacher_id, subject, trial_date, notes } = await request.json()
  if (!submission_id || !teacher_id || !subject || !trial_date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Fetch the submission
  const { data: sub } = await admin.from('form_submissions').select('*').eq('id', submission_id).single()
  if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

  // Create the trial student
  const { data: trial, error: trialError } = await admin.from('trial_students').insert({
    teacher_id,
    name: sub.student_name,
    age: sub.student_age ?? 0,
    tier: sub.age_group ?? 'Unknown',
    subject,
    trial_date,
    parent_name: sub.parent_name ?? null,
    parent_contact: sub.contact ?? null,
    notes: notes?.trim() || sub.focus_area || null,
    outcome: 'pending',
  }).select().single()

  if (trialError) return NextResponse.json({ error: trialError.message }, { status: 500 })

  // Mark submission as converted
  await admin.from('form_submissions').update({ status: 'converted' }).eq('id', submission_id)

  return NextResponse.json({ ok: true, trial_id: trial.id })
}
