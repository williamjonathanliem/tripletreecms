import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { CURRICULUM } from '@/lib/curriculum'

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

  const body = await request.json()
  const { submission_id, teacher_id, subject, notes, mode = 'trial' } = body as {
    submission_id: string; teacher_id: string; subject: string; notes?: string; mode?: 'trial' | 'student'
  }

  if (!submission_id || !teacher_id || !subject) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: sub } = await admin.from('form_submissions').select('*').eq('id', submission_id).single()
  if (!sub) return NextResponse.json({ error: 'Submission not found' }, { status: 404 })

  // ── Trial mode (original behaviour) ───────────────────────────────────────
  if (mode === 'trial') {
    const { trial_date } = body as { trial_date: string }
    if (!trial_date) return NextResponse.json({ error: 'trial_date required for trial mode' }, { status: 400 })

    const { data: trial, error: trialError } = await admin.from('trial_students').insert({
      teacher_id,
      name:           sub.student_name,
      age:            sub.student_age ?? 0,
      tier:           sub.age_group ?? 'Unknown',
      subject,
      trial_date,
      parent_name:    sub.parent_name ?? null,
      parent_contact: sub.contact ?? null,
      parent_email:   sub.email ?? null,
      notes:          notes?.trim() || sub.focus_area || null,
      outcome:        'pending',
    }).select().single()

    if (trialError) return NextResponse.json({ error: trialError.message }, { status: 500 })

    await admin.from('form_submissions').update({ status: 'converted' }).eq('id', submission_id)
    return NextResponse.json({ ok: true, mode: 'trial', trial_id: trial.id })
  }

  // ── Student mode (direct enrolment) ───────────────────────────────────────
  const { tier = '', branch, enrolled_date, age } = body as {
    tier?: string; branch: string; enrolled_date: string; age?: number
  }
  if (!branch || !enrolled_date) {
    return NextResponse.json({ error: 'branch and enrolled_date required for student mode' }, { status: 400 })
  }

  const isCoding = subject === 'coding'
  const resolvedTier    = isCoding ? tier : (SUBJECT_LABELS[subject] ?? subject)
  const module_total    = isCoding ? (CURRICULUM[resolvedTier]?.length ?? 7) : 1
  const resolvedAge     = age ?? sub.student_age ?? 0

  const { data: student, error: studentError } = await admin.from('students').insert({
    teacher_id,
    name:           sub.student_name,
    age:            resolvedAge,
    subject,
    tier:           resolvedTier,
    branch,
    enrolled_date,
    parent_contact: sub.contact ?? null,
    parent_email:   sub.email ?? null,
    notes:          notes?.trim() || sub.focus_area || null,
    module_total,
    module_current: 0,
  }).select().single()

  if (studentError) return NextResponse.json({ error: studentError.message }, { status: 500 })

  await admin.from('form_submissions').update({ status: 'converted' }).eq('id', submission_id)
  return NextResponse.json({ ok: true, mode: 'student', student_id: student.id })
}

// Subject label map (mirrors SUBJECT_META.label without importing types)
const SUBJECT_LABELS: Record<string, string> = {
  chinese:       'Chinese',
  chinese_extra: 'Chinese (Extra)',
  english:       'English',
  maths:         'Maths',
  science:       'Science',
  calligraphy:   'Calligraphy',
  arts:          'Arts & Craft',
}
