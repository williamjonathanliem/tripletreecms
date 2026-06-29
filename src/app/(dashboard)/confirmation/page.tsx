import { redirect } from 'next/navigation'
import { getTeacherContext } from '@/lib/teacher'
import { BootcampConfirmationTab } from '@/components/hr/BootcampConfirmationTab'

export const dynamic = 'force-dynamic'

export default async function ConfirmationPage() {
  const ctx = await getTeacherContext()
  if (!ctx) redirect('/login')

  const subjects = ctx.role === 'hr' ? undefined : ctx.subjects

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Confirmation</h1>
        <p className="text-xs md:text-sm text-gray-400 mt-0.5">Generate enrollment confirmation PDFs for bootcamps, classes, and workshops</p>
      </div>
      <BootcampConfirmationTab
        currentUserName={ctx.name}
        subjects={subjects}
      />
    </div>
  )
}
