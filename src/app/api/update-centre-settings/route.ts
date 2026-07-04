import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeacherContext } from '@/lib/teacher'

export async function POST(req: NextRequest) {
  const ctx = await getTeacherContext()
  if (!ctx || ctx.role !== 'hr') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json()
  const admin = createAdminClient()

  const { error } = await admin.from('centre_settings').upsert({
    id:            1,
    centre_name:   body.centre_name   || null,
    phone:         body.phone         || null,
    contact_email: body.contact_email || null,
    address:       body.address       || null,
    hours_weekday: body.hours_weekday || null,
    hours_weekend: body.hours_weekend || null,
    updated_at:    new Date().toISOString(),
    updated_by:    ctx.id,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
