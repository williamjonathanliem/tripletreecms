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

  // ── Unauthenticated ──────────────────────────────────────────────────────────
  if (!user) {
    if (PARENT_ROUTES.some(r => pathname.startsWith(r)))
      return redirect(request, '/parent-login')

    if (!PUBLIC_ROUTES.some(r => pathname.startsWith(r)))
      return redirect(request, '/login')

    return supabaseResponse
  }

  // ── Authenticated — check whether they are a teacher ────────────────────────
  const { data: teacher } = await supabase
    .from('teachers')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const isTeacher = !!teacher

  if (isTeacher) {
    if (pathname === '/login' || pathname === '/parent-login' ||
        PARENT_ROUTES.some(r => pathname.startsWith(r))) {
      return redirect(request, '/dashboard')
    }
    if (pathname.startsWith('/hr') && teacher?.role !== 'hr') {
      return redirect(request, '/dashboard')
    }
    return supabaseResponse
  }

  // ── Parent (authenticated but not a teacher) ─────────────────────────────────
  if (TEACHER_ROUTES.some(r => pathname.startsWith(r))) {
    return redirect(request, '/portal')
  }

  if (pathname === '/login' || pathname === '/parent-login') {
    return redirect(request, '/portal')
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
