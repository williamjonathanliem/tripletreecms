import { SUBJECT_META, type Subject } from '@/types'

interface Props {
  subject: Subject
  size?: 'sm' | 'md'
}

export function SubjectBadge({ subject, size = 'sm' }: Props) {
  const meta = SUBJECT_META[subject]
  if (!meta) return null
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full whitespace-nowrap ${
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      }`}
      style={{ color: meta.color, background: meta.bg }}
    >
      {meta.label}
    </span>
  )
}
