'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, UserPlus, CalendarDays, MessageSquare,
  BookOpen, User, LogOut, Calendar, Bell, BarChart2, Clock, PieChart,
  ClipboardList, FileText, CreditCard, ShieldCheck, Loader2, UserCog,
  MapPin, Mail, Settings,
} from 'lucide-react'
import { InstallButton } from '@/components/layout/InstallButton'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { startNavProgress } from '@/components/layout/NavigationProgress'
import type { Subject } from '@/types'

interface SidebarProps {
  role: 'teacher' | 'hr'
  subjects: Subject[]
}

const NAV_LABELS = {
  en: {
    dashboard:        'Dashboard',
    students:         'Students',
    trial:            'Trial Students',
    classes:          'Classes',
    feedback:         'Class Log',
    schedule:         'Schedule',
    curriculum:       'Curriculum',
    confirmation:     'Confirmation',
    overview:         'Overview',
    teachers:         'Teachers',
    availability:     'Availability',
    subjects:         'Subjects',
    staff_notices:    'Staff Notices',
    parent_notices:   'Parent Notices',
    submissions:      'Form Submissions',
    payments:         'Payments',
    parents:          'Parent Accounts',
    branches:         'Branches',
    analytics:        'Analytics',
    settings:         'Settings',
    profile:          'Profile',
    signout:          'Sign Out',
    // group labels
    grp_people:       'People',
    grp_classes:      'Classes',
    grp_finance:      'Finance',
    grp_comms:        'Communication',
    grp_admin:        'Admin',
  },
  zh: {
    dashboard:        '主页',
    students:         '学生',
    trial:            '试课学生',
    classes:          '课程',
    feedback:         '课堂记录',
    schedule:         '课程表',
    curriculum:       '课程大纲',
    confirmation:     '确认书',
    overview:         '总览',
    teachers:         '教师',
    availability:     '空档时间',
    subjects:         '科目',
    staff_notices:    '员工公告',
    parent_notices:   '家长通知',
    submissions:      '申请表',
    payments:         '收费管理',
    parents:          '家长账号',
    branches:         '分校',
    analytics:        '数据分析',
    settings:         '系统设置',
    profile:          '个人资料',
    signout:          '登出',
    grp_people:       '人员',
    grp_classes:      '课程',
    grp_finance:      '财务',
    grp_comms:        '通讯',
    grp_admin:        '管理',
  },
} as const

export function Sidebar({ role, subjects }: SidebarProps) {
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const currentTab  = searchParams.get('tab')
  const router      = useRouter()
  const supabase    = createClient()
  const { lang, toggle } = useCmsLang()
  const t = NAV_LABELS[lang]
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    startNavProgress()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // ── Teacher nav ────────────────────────────────────────────────────────────
  const teacherNav = [
    { href: '/dashboard',    label: t.dashboard,    icon: LayoutDashboard },
    { href: '/students',     label: t.students,     icon: Users },
    { href: '/trial',        label: t.trial,        icon: UserPlus },
    { href: '/classes',      label: t.classes,      icon: CalendarDays },
    { href: '/feedback',     label: t.feedback,     icon: MessageSquare },
    { href: '/schedule',     label: t.schedule,     icon: Calendar },
    ...(subjects.includes('coding') ? [{ href: '/curriculum', label: t.curriculum, icon: BookOpen }] : []),
    { href: '/confirmation', label: t.confirmation, icon: FileText },
  ]

  // ── HR nav groups ──────────────────────────────────────────────────────────
  type NavItem = { href: string; label: string; icon: React.ElementType; tab?: string | null; isPage?: boolean }
  type NavGroup = { label?: string; items: NavItem[] }

  const hrNavGroups: NavGroup[] = [
    {
      items: [
        { href: '/hr', label: t.overview, icon: LayoutDashboard, tab: null },
      ],
    },
    {
      label: t.grp_people,
      items: [
        { href: '/hr?tab=teachers', label: t.teachers, icon: Users,    tab: 'teachers' },
        { href: '/students',         label: t.students, icon: UserPlus, isPage: true },
        { href: '/trial',            label: t.trial,    icon: UserPlus, isPage: true },
        { href: '/hr?tab=parents',  label: t.parents,  icon: UserCog,  tab: 'parents' },
      ],
    },
    {
      label: t.grp_classes,
      items: [
        { href: '/classes',             label: t.classes,      icon: CalendarDays, isPage: true },
        { href: '/hr?tab=schedule',     label: t.schedule,     icon: Calendar,     tab: 'schedule' },
        { href: '/hr?tab=availability', label: t.availability, icon: Clock,        tab: 'availability' },
      ],
    },
    {
      label: t.grp_finance,
      items: [
        { href: '/hr?tab=payments',     label: t.payments,     icon: CreditCard, tab: 'payments' },
        { href: '/hr?tab=confirmation', label: t.confirmation, icon: FileText,   tab: 'confirmation' },
      ],
    },
    {
      label: t.grp_comms,
      items: [
        { href: '/hr?tab=announcements',        label: t.staff_notices,  icon: Bell,          tab: 'announcements' },
        { href: '/hr?tab=parent-announcements', label: t.parent_notices, icon: Mail,          tab: 'parent-announcements' },
        { href: '/hr?tab=submissions',          label: t.submissions,    icon: ClipboardList, tab: 'submissions' },
      ],
    },
    {
      label: t.grp_admin,
      items: [
        { href: '/hr?tab=subjects',  label: t.subjects,  icon: PieChart,   tab: 'subjects' },
        { href: '/hr?tab=branches',  label: t.branches,  icon: MapPin,     tab: 'branches' },
        { href: '/hr?tab=analytics', label: t.analytics, icon: BarChart2,  tab: 'analytics' },
        { href: '/hr?tab=settings',  label: t.settings,  icon: Settings,   tab: 'settings' },
      ],
    },
  ]

  // ── Active state helpers ───────────────────────────────────────────────────
  function isHrTabActive(tab: string | null | undefined) {
    if (pathname !== '/hr') return false
    if (!tab) return !currentTab || currentTab === 'overview'
    return currentTab === tab
  }
  function isPageActive(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))
  }

  // ── NavLink ────────────────────────────────────────────────────────────────
  function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: React.ElementType; active: boolean }) {
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          active ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <aside className="hidden md:flex w-60 h-screen sticky top-0 bg-white border-r border-gray-100 flex-col shrink-0">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="Triple Tree" width={32} height={32} className="rounded-lg object-contain" />
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Triple Tree</p>
            <p className="text-[11px] text-gray-400 leading-tight">
              {role === 'hr'
                ? (lang === 'zh' ? 'HR 行政' : 'HR Administration')
                : (lang === 'zh' ? '教育管理系统' : 'Enrichment CMS')}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {role === 'hr' ? (
          <>
            {/* HR badge */}
            <div className="flex items-center gap-2 px-3 py-1">
              <ShieldCheck className="w-3 h-3 text-[#1A5276]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A5276]">
                {lang === 'zh' ? 'HR 管理' : 'HR Admin'}
              </span>
            </div>

            {hrNavGroups.map((group, gi) => (
              <div key={gi}>
                {group.label && (
                  <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {group.items.map(item => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      active={item.isPage ? isPageActive(item.href) : isHrTabActive(item.tab)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="space-y-0.5">
            {teacherNav.map(item => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isPageActive(item.href)}
              />
            ))}
          </div>
        )}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-0.5">
        <InstallButton />
        <button
          onClick={toggle}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors"
        >
          <span>{lang === 'en' ? 'Language' : '语言'}</span>
          <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5 font-semibold text-gray-600">
            {lang === 'en' ? 'EN' : '中文'}
          </span>
        </button>
        <Link href="/profile"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            pathname === '/profile' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
          )}>
          <User className="w-4 h-4 shrink-0" />
          <span>{t.profile}</span>
        </Link>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 w-full transition-colors disabled:opacity-60"
        >
          {signingOut ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <LogOut className="w-4 h-4 shrink-0" />}
          <span>{signingOut ? (lang === 'zh' ? '退出中…' : 'Signing out…') : t.signout}</span>
        </button>
      </div>
    </aside>
  )
}
