import { Suspense } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { getTeacherContext } from '@/lib/teacher'
import { CmsLangProvider } from '@/lib/context/cms-lang-context'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getTeacherContext()
  const role = ctx?.role ?? 'teacher'
  const subjects = ctx?.subjects ?? []

  return (
    <CmsLangProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Suspense fallback={<div className="hidden md:block w-60 shrink-0 bg-white border-r border-gray-100" />}>
          <Sidebar role={role} subjects={subjects} />
        </Suspense>
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>
      {/* Mobile bottom navigation */}
      <Suspense fallback={null}>
        <BottomNav role={role} subjects={subjects} />
      </Suspense>
    </CmsLangProvider>
  )
}
