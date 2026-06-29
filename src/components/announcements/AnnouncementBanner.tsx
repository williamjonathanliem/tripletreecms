'use client'

import { useState, useEffect } from 'react'
import { X, Megaphone } from 'lucide-react'
import type { Announcement } from '@/types'

const DISMISSED_KEY = 'dismissed_announcements'

function getDismissed(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]') } catch { return [] }
}

function addDismissed(id: string) {
  const prev = getDismissed()
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...prev, id]))
}

export function AnnouncementBanner({ announcements }: { announcements: Announcement[] }) {
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    setDismissed(getDismissed())
  }, [])

  const visible = announcements.filter(a => !dismissed.includes(a.id))
  if (visible.length === 0) return null

  function dismiss(id: string) {
    addDismissed(id)
    setDismissed(prev => [...prev, id])
  }

  return (
    <div className="space-y-2">
      {visible.map(a => (
        <div key={a.id} className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <Megaphone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">{a.title}</p>
            <p className="text-xs text-amber-700 mt-0.5 whitespace-pre-line">{a.body}</p>
          </div>
          <button
            onClick={() => dismiss(a.id)}
            className="shrink-0 p-1 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-amber-500" />
          </button>
        </div>
      ))}
    </div>
  )
}
