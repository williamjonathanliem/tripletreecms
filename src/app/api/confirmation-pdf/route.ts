import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { BootcampConfirmationDocument, type ConfirmationData } from '@/lib/pdf/bootcamp-confirmation'
import fs from 'fs'
import path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cs) { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
    },
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: teacher } = await supabase.from('teachers').select('role').eq('id', user.id).single()
  if (!teacher) return NextResponse.json({ error: 'Teacher not found' }, { status: 403 })

  const data: ConfirmationData = await request.json()

  // Read logo
  let logo_base64: string | null = null
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    if (fs.existsSync(logoPath)) {
      logo_base64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
    }
  } catch { /* logo missing — proceed without it */ }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(BootcampConfirmationDocument, { ...data, logo_base64 }) as any
  const buffer = await renderToBuffer(element)

  const filename = `Enrollment-Confirmation-${data.student_name.replace(/\s+/g, '-')}-${data.confirmation_number}.pdf`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
