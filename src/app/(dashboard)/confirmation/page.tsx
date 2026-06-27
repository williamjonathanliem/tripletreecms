import { redirect } from 'next/navigation'
import { getTeacherContext } from '@/lib/teacher'
import { BootcampConfirmationTab } from '@/components/hr/BootcampConfirmationTab'

export const dynamic = 'force-dynamic'

export default async function ConfirmationPage() {
  const ctx = await getTeacherContext()
  if (!ctx) redirect('/login')

  // HR sees all bootcamp types; teachers are filtered by their subjects
  const subjects = ctx.role === 'hr' ? undefined : ctx.subjects

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Confirmation</h1>
        <p className="text-sm text-gray-400 mt-0.5">Generate bootcamp enrollment confirmation PDFs</p>
      </div>
      <BootcampConfirmationTab
        currentUserName={ctx.name}
        subjects={subjects}
      />
    </div>
  )
}
