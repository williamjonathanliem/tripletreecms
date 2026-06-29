'use client'

import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

interface Props {
  variant: 'students' | 'trial' | 'classes'
  count: number
}

export function PageHeading({ variant, count }: Props) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  if (variant === 'students') {
    const sub = count === 1 ? t.students.page_subtitle_singular : t.students.page_subtitle_plural
    return (
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">{t.students.page_title}</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">{count} {sub}</p>
      </div>
    )
  }

  if (variant === 'trial') {
    return (
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t.trial.page_title}</h1>
        <p className="text-xs md:text-sm text-gray-400 mt-0.5">{count} {t.trial.page_subtitle}</p>
      </div>
    )
  }

  // classes
  const sub = count === 1 ? t.classes.page_subtitle_singular : t.classes.page_subtitle_plural
  return (
    <div>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">{t.classes.page_title}</h1>
      <p className="text-xs md:text-sm text-gray-400 mt-0.5">{count} {sub}</p>
    </div>
  )
}
