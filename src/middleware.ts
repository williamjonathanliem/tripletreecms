import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Open to everyone — no login required
const PUBLIC_ROUTES  = ['/login', '/parent-login', '/forgot-password', '/reset-password', '/set-password', '/form', '/auth/callback']
// Only authenticated teachers/HR can access these
const TEACHER_ROUTES = ['/dashboard', '/students', '/trial', '/classes', '/feedback', '/schedule', '/curriculum', '/hr', '/profile', '/confirmation']
// Only authenticated parents can access these
const PARENT_ROUTES  = ['/portal']

function redirect(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone()
  url.pathname = pathname
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  console.log(`[MW] ${pathname} | user=${user?.id ?? 'none'} email=${user?.email ?? '-'}`)

  // ── Unauthenticated ──────────────────────────────────────────────────────────
  if (!user) {
    if (PARENT_ROUTES.some(r => pathname.startsWith(r)))
      return redirect(request, '/parent-login')

    if (!PUBLIC_ROUTES.some(r => pathname.startsWith(r)))
      return redirect(request, '/login')

    return supabaseResponse
  }

  // ── Authenticated — check whether they are a teacher ────────────────────────
  const { data: teacher, error: teacherErr } = await supabase
    .from('teachers')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  console.log(`[MW] teachers query → data=${JSON.stringify(teacher)} err=${teacherErr?.message ?? 'none'}`)

  const isTeacher = !!teacher

  if (isTeacher) {
    console.log(`[MW] IS teacher role=${teacher?.role} → checking if blocked from ${pathname}`)
    // Teacher landing on auth pages or parent portal → send to dashboard
    if (pathname === '/login' || pathname === '/parent-login' ||
        PARENT_ROUTES.some(r => pathname.startsWith(r))) {
      console.log(`[MW] teacher on parent/auth route → /dashboard`)
      return redirect(request, '/dashboard')
    }

    // HR-only guard
    if (pathname.startsWith('/hr') && teacher?.role !== 'hr') {
      return redirect(request, '/dashboard')
    }

    return supabaseResponse
  }

  console.log(`[MW] NOT teacher → parent path. pathname=${pathname}`)

  // ── Parent (authenticated but not a teacher) ─────────────────────────────────
  if (TEACHER_ROUTES.some(r => pathname.startsWith(r))) {
    console.log(`[MW] parent on teacher route → /portal`)
    return redirect(request, '/portal')
  }

  if (pathname === '/login' || pathname === '/parent-login') {
    console.log(`[MW] parent on login → /portal`)
    return redirect(request, '/portal')
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
