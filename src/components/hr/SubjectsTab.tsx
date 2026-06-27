'use client'

import { SUBJECTS, SUBJECT_META, type Subject } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

interface Props {
  teacherSubjectCounts: Record<Subject, number>
  classSubjectCounts: Record<Subject, number>
}

export function SubjectsTab({ teacherSubjectCounts, classSubjectCounts }: Props) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{t.hr_subjects.col_subject}</th>
            <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t.hr_subjects.col_teachers}</th>
            <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t.hr_subjects.col_classes}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {SUBJECTS.map(s => {
            const meta = SUBJECT_META[s]
            return (
              <tr key={s}>
                <td className="px-5 py-4">
                  <span
                    className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ color: meta.color, background: meta.bg }}
                  >
                    {meta.label}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                  {teacherSubjectCounts[s] ?? 0}
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                  {classSubjectCounts[s] ?? 0}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
