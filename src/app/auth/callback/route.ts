import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` lets the invite URL carry a destination hint
  const next = searchParams.get('next') ?? '/portal'

  if (!code) {
    // No code — just send them somewhere safe
    return NextResponse.redirect(`${origin}/parent-login`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  console.log(`[callback] code=${code?.slice(0,8)}... next=${next}`)

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    console.error('[callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/parent-login?error=link_expired`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  console.log(`[callback] user=${user?.id} email=${user?.email}`)
  if (!user) return NextResponse.redirect(`${origin}/parent-login`)

  const { data: teacher, error: teacherErr } = await supabase
    .from('teachers')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  console.log(`[callback] teachers query → data=${JSON.stringify(teacher)} err=${teacherErr?.message ?? 'none'}`)

  const destination = teacher ? '/dashboard' : (next.startsWith('/') ? next : '/portal')
  console.log(`[callback] → redirecting to ${destination}`)
  return NextResponse.redirect(`${origin}${destination}`)
}
