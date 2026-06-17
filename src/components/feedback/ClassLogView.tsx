'use client'

import { useState } from 'react'
import { PenLine, History } from 'lucide-react'
import { FeedbackForm } from './FeedbackForm'
import { TIER_COLORS } from '@/types'

interface ClassOption {
  id: string
  tier: string
  branch: string
  schedule_day: string | null
  schedule_time: string | null
}

interface LogEntry {
  id: string
  class_id: string
  how_was_class: string
  topics_covered: string
  other_comments: string | null
  created_at: string
  class: { tier?: string; branch?: string } | null
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString('en-MY', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function LogCard({ log }: { log: LogEntry }) {
  const tier = log.class?.tier ?? ''
  const branch = log.class?.branch ?? ''
  const color = TIER_COLORS[tier] || '#6B7280'
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: color }}>
            {tier}
          </span>
          {branch && <span className="text-xs text-gray-500">{branch}</span>}
        </div>
        <p className="text-xs text-gray-400">{formatDateTime(log.created_at)}</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">How it went</p>
          <p className="text-sm text-gray-700">{log.how_was_class}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Topics Covered</p>
          <p className="text-sm text-gray-700">{log.topics_covered}</p>
        </div>
        {log.other_comments && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-500 italic">{log.other_comments}</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  classes: ClassOption[]
  allLogs: LogEntry[]
  defaultClassId?: string
  defaultTab: 'log' | 'history'
}

export function ClassLogView({ classes, allLogs, defaultClassId, defaultTab }: Props) {
  const [tab, setTab] = useState<'log' | 'history'>(defaultTab)

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Log</h1>
          <p className="text-sm text-gray-400 mt-0.5">Track how each session went</p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setTab('log')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === 'log' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PenLine className="w-3.5 h-3.5" /> Log Session
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-3.5 h-3.5" /> View Logs ({allLogs.length})
          </button>
        </div>
      </div>

      {tab === 'log' ? (
        <FeedbackForm classes={classes} defaultClassId={defaultClassId} />
      ) : (
        <div className="space-y-3">
          {allLogs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
              <History className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No logs yet. Start by logging a session.</p>
            </div>
          ) : (
            allLogs.map(log => <LogCard key={log.id} log={log} />)
          )}
        </div>
      )}
    </div>
  )
}
