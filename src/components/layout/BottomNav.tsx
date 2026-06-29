'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, CalendarDays, MessageSquare, MoreHorizontal,
  X, Calendar, UserPlus, BookOpen, FileText, User, LogOut, Loader2,
  BarChart2, CreditCard, Clock, PieChart, Bell, ClipboardList, UserCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { startNavProgress } from '@/components/layout/NavigationProgress'
import type { Subject } from '@/types'

interface BottomNavProps {
  role: 'teacher' | 'hr'
  subjects: Subject[]
}

export function BottomNav({ role, subjects }: BottomNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab')
  const router = useRouter()
  const { lang, toggle } = useCmsLang()
  const supabase = createClient()
  const [moreOpen, setMoreOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close More panel on route change
  useEffect(() => { setMoreOpen(false) }, [pathname, currentTab])

  // Close on outside tap
  useEffect(() => {
    if (!moreOpen) return
    function onTap(e: MouseEvent | TouchEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onTap)
    document.addEventListener('touchstart', onTap)
    return () => {
      document.removeEventListener('mousedown', onTap)
      document.removeEventListener('touchstart', onTap)
    }
  }, [moreOpen])

  async function handleSignOut() {
    setSigningOut(true)
    startNavProgress()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string) {
    return pathname === href || (href !== '/dashboard' && href !== '/hr' && pathname.startsWith(href + '/'))
  }

  function isHrTabActive(tab: string | null) {
    if (pathname !== '/hr') return false
    if (tab === null) return !currentTab
    return currentTab === tab
  }

  // ── Teacher primary nav ──────────────────────────────────────
  const teacherPrimary = [
    { href: '/dashboard', label: lang === 'zh' ? '主页' : 'Home', icon: LayoutDashboard, active: isActive('/dashboard') },
    { href: '/students',  label: lang === 'zh' ? '学生' : 'Students', icon: Users,          active: isActive('/students') },
    { href: '/classes',   label: lang === 'zh' ? '课程' : 'Classes',  icon: CalendarDays,   active: isActive('/classes') },
    { href: '/feedback',  label: lang === 'zh' ? '课堂' : 'Class Log', icon: MessageSquare,  active: isActive('/feedback') },
  ]

  const teacherMore = [
    { href: '/trial',        label: lang === 'zh' ? '试课学生' : 'Trial Students', icon: UserPlus },
    { href: '/schedule',     label: lang === 'zh' ? '课程表' : 'Schedule',         icon: Calendar },
    ...(subjects.includes('coding') ? [{ href: '/curriculum', label: lang === 'zh' ? '课程大纲' : 'Curriculum', icon: BookOpen }] : []),
    { href: '/confirmation', label: lang === 'zh' ? '确认书' : 'Confirmation',     icon: FileText },
  ]

  // ── HR primary nav ───────────────────────────────────────────
  const hrPrimary = [
    { href: '/hr',              label: lang === 'zh' ? '总览' : 'Overview', icon: LayoutDashboard, active: isHrTabActive(null) },
    { href: '/hr?tab=teachers', label: lang === 'zh' ? '教师' : 'Teachers', icon: Users,           active: isHrTabActive('teachers') },
    { href: '/hr?tab=payments', label: lang === 'zh' ? '收费' : 'Payments', icon: CreditCard,      active: isHrTabActive('payments') },
    { href: '/hr?tab=analytics',label: lang === 'zh' ? '分析' : 'Analytics', icon: BarChart2,      active: isHrTabActive('analytics') },
  ]

  const hrMore = [
    { href: '/hr?tab=availability',  label: lang === 'zh' ? '空档时间' : 'Availability',   icon: Clock },
    { href: '/hr?tab=subjects',      label: lang === 'zh' ? '科目' : 'Subjects',           icon: PieChart },
    { href: '/hr?tab=announcements', label: lang === 'zh' ? '公告' : 'Announcements',      icon: Bell },
    { href: '/hr?tab=submissions',   label: lang === 'zh' ? '申请表' : 'Submissions',      icon: ClipboardList },
    { href: '/hr?tab=confirmation',  label: lang === 'zh' ? '确认书' : 'Confirmation',     icon: FileText },
    { href: '/hr?tab=parents',       label: lang === 'zh' ? '家长账号' : 'Parent Accounts', icon: UserCog },
    { href: '/students',             label: lang === 'zh' ? '学生' : 'Students',           icon: Users },
    { href: '/trial',                label: lang === 'zh' ? '试课学生' : 'Trial Students', icon: UserPlus },
  ]

  const primaryNav = role === 'hr' ? hrPrimary : teacherPrimary
  const moreItems  = role === 'hr' ? hrMore    : teacherMore
  const isMoreActive = moreOpen || (role === 'teacher'
    ? ['/trial', '/schedule', '/curriculum', '/confirmation', '/profile'].some(p => pathname.startsWith(p))
    : ['/hr?tab=availability', '/hr?tab=subjects', '/hr?tab=announcements', '/hr?tab=submissions', '/hr?tab=confirmation', '/hr?tab=parents', '/students', '/trial', '/profile'].some(p => pathname === p || (p.startsWith('/hr') && isHrTabActive(p.split('tab=')[1])))
  )

  const brandColor = '#1A5276'

  return (
    <>
      {/* More panel overlay — mobile only */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/20" aria-hidden />
      )}

      {/* More panel — mobile only */}
      <div
        ref={panelRef}
        className={cn(
          'md:hidden fixed left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 transition-transform duration-300 ease-out',
          moreOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'
        )}
        style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Panel handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-8 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-4 pb-4 max-h-[55vh] overflow-y-auto">
          {/* Section heading */}
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1 pt-2 pb-2">
            {lang === 'zh' ? '更多功能' : 'More'}
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {moreItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  'flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors',
                  (pathname === item.href || (item.href.includes('tab=') && pathname === '/hr' && currentTab === item.href.split('tab=')[1]))
                    ? 'bg-[#EBF5FB] text-[#1A5276]'
                    : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="text-xs leading-tight">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-3" />

          {/* Profile, Language, Sign Out */}
          <div className="space-y-1">
            <Link
              href="/profile"
              onClick={() => setMoreOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors',
                pathname === '/profile' ? 'bg-[#EBF5FB] text-[#1A5276]' : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>{lang === 'zh' ? '个人资料' : 'Profile'}</span>
            </Link>

            <button
              onClick={toggle}
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🌐</span>
                <span>{lang === 'zh' ? '语言 / Language' : 'Language / 语言'}</span>
              </div>
              <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5 font-semibold text-gray-600">
                {lang === 'en' ? 'EN' : '中文'}
              </span>
            </button>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              {signingOut
                ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                : <LogOut className="w-4 h-4 shrink-0" />}
              <span>{signingOut ? (lang === 'zh' ? '退出中…' : 'Signing out…') : (lang === 'zh' ? '登出' : 'Sign Out')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom tab bar — mobile only */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex h-16">
          {primaryNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
              onClick={() => setMoreOpen(false)}
            >
              {item.active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ backgroundColor: brandColor }}
                />
              )}
              <item.icon
                className="w-5 h-5 transition-colors"
                style={{ color: item.active ? brandColor : '#9CA3AF' }}
              />
              <span
                className="text-[10px] font-medium leading-none transition-colors"
                style={{ color: item.active ? brandColor : '#9CA3AF' }}
              >
                {item.label}
              </span>
            </Link>
          ))}

          {/* More tab */}
          <button
            className="relative flex-1 flex flex-col items-center justify-center gap-1 transition-colors"
            onClick={() => setMoreOpen(v => !v)}
          >
            {(moreOpen || (isMoreActive && !moreOpen)) && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                style={{ backgroundColor: brandColor }}
              />
            )}
            {moreOpen
              ? <X className="w-5 h-5" style={{ color: brandColor }} />
              : <MoreHorizontal className="w-5 h-5" style={{ color: isMoreActive && !moreOpen ? brandColor : '#9CA3AF' }} />
            }
            <span
              className="text-[10px] font-medium leading-none"
              style={{ color: moreOpen || isMoreActive ? brandColor : '#9CA3AF' }}
            >
              {lang === 'zh' ? '更多' : 'More'}
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
