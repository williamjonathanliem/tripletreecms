import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/portal'

  if (!code) {
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

  console.log('[callback] code:', code?.slice(0, 12) + '...', 'next:', next)
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  console.log('[callback] exchangeCodeForSession error:', error?.message ?? 'none')
  if (error) {
    return NextResponse.redirect(`${origin}/parent-login?error=link_expired`)
  }

  if (next && next.startsWith('/') && next !== '/portal') {
    console.log('[callback] redirecting to next:', next)
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Default: route by role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/parent-login`)

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.redirect(`${origin}${teacher ? '/dashboard' : '/portal'}`)
}
