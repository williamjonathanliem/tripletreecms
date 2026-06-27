'use client'

import { ShieldCheck, CalendarCheck } from 'lucide-react'
import { ProfileForm } from './ProfileForm'
import { ChangePasswordForm } from './ChangePasswordForm'
import { AvailabilityWidget } from './AvailabilityWidget'
import { SubjectBadge } from '@/components/ui/SubjectBadge'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'
import type { Subject } from '@/types'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface Props {
  name: string
  email: string
  role: string
  subjects: Subject[]
  teacherId: string
}

export function ProfilePageView({ name, email, role, subjects, teacherId }: Props) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang].profile

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.page_title}</h1>
        <p className="text-sm text-gray-400 mt-0.5">{t.page_subtitle}</p>
      </div>

      {/* Profile hero */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{ background: role === 'hr' ? '#1A5276' : '#1E8449' }}>
            {getInitials(name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-gray-900">{name}</p>
            <p className="text-sm text-gray-400">{email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {role === 'hr' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E6F1FB] text-[#1A5276]">
                  <ShieldCheck className="w-3.5 h-3.5" /> {t.role_hr}
                </span>
              ) : (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EAFAF1] text-[#1E8449]">
                  {t.role_teacher}
                </span>
              )}
              {subjects.map(s => <SubjectBadge key={s} subject={s} />)}
            </div>
          </div>
        </div>
      </div>

      {/* Account details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">{t.section_account}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t.section_account_sub}</p>
        </div>
        <div className="p-6">
          <ProfileForm teacherName={name} email={email} />
        </div>
      </div>

      {/* Weekly availability */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-[#1A5276]" />
            <h2 className="text-sm font-bold text-gray-900">{t.section_availability}</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{t.section_availability_sub}</p>
        </div>
        <div className="p-6">
          <AvailabilityWidget teacherId={teacherId} />
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">{t.section_password}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t.section_password_sub}</p>
        </div>
        <div className="p-6">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  )
}
