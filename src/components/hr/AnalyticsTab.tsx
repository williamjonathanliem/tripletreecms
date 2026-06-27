'use client'

import { useState, useEffect } from 'react'
import { Download, TrendingUp, Users, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { SUBJECT_META, SUBJECTS, type Subject } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

type MonthRow = {
  month: string
  newStudents: number
  dropped: number   // "converting" → dropped in trial is not the same; track manual "dropped" trials as proxy
  trialCount: number
  enrolledCount: number
}

type SubjectConversion = {
  subject: Subject
  trials: number
  enrolled: number
  rate: number
}

function getMonthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })
}

function downloadCSV(rows: string[][], filename: string) {
  const content = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export function AnalyticsTab() {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [monthRows, setMonthRows] = useState<MonthRow[]>([])
  const [subjectConv, setSubjectConv] = useState<SubjectConversion[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    const [
      { data: students },
      { data: trials },
    ] = await Promise.all([
      supabase.from('students').select('subject, enrolled_date, created_at'),
      supabase.from('trial_students').select('subject, outcome, created_at'),
    ])

    // ── Monthly enrollment summary ───────────────────────────────
    const monthMap: Record<string, { new: number; trials: number; enrolled: number }> = {}

    for (const s of students ?? []) {
      const date = s.enrolled_date ?? s.created_at
      const ym = date.slice(0, 7)
      if (!monthMap[ym]) monthMap[ym] = { new: 0, trials: 0, enrolled: 0 }
      monthMap[ym].new++
    }

    for (const trial of trials ?? []) {
      const ym = trial.created_at.slice(0, 7)
      if (!monthMap[ym]) monthMap[ym] = { new: 0, trials: 0, enrolled: 0 }
      monthMap[ym].trials++
      if (trial.outcome === 'converting') monthMap[ym].enrolled++
    }

    const sortedMonths = Object.entries(monthMap).sort(([a], [b]) => b.localeCompare(a)).slice(0, 12)
    setMonthRows(sortedMonths.map(([month, v]) => ({
      month,
      newStudents: v.new,
      dropped: 0,
      trialCount: v.trials,
      enrolledCount: v.enrolled,
    })))

    // ── Trial conversion by subject ───────────────────────────────
    const convMap: Record<string, { trials: number; enrolled: number }> = {}
    for (const trial of trials ?? []) {
      const s = trial.subject ?? 'coding'
      if (!convMap[s]) convMap[s] = { trials: 0, enrolled: 0 }
      convMap[s].trials++
      if (trial.outcome === 'converting') convMap[s].enrolled++
    }

    setSubjectConv(
      SUBJECTS.map(s => ({
        subject: s,
        trials: convMap[s]?.trials ?? 0,
        enrolled: convMap[s]?.enrolled ?? 0,
        rate: convMap[s]?.trials ? Math.round((convMap[s].enrolled / convMap[s].trials) * 100) : 0,
      }))
    )

    setLoading(false)
  }

  function exportEnrollmentCSV() {
    const rows = [
      [t.hr_analytics.col_month, t.hr_analytics.col_new_students, t.hr_analytics.col_trials, t.hr_analytics.col_converted],
      ...monthRows.map(r => [
        getMonthLabel(r.month),
        String(r.newStudents),
        String(r.trialCount),
        String(r.enrolledCount),
      ]),
    ]
    downloadCSV(rows, 'enrollment-summary.csv')
  }

  function exportConversionCSV() {
    const rows = [
      [t.hr_subjects.col_subject, t.hr_analytics.total_trials, t.hr_analytics.converted, t.hr_analytics.overall_rate],
      ...subjectConv.map(r => [
        SUBJECT_META[r.subject].label,
        String(r.trials),
        String(r.enrolled),
        `${r.rate}%`,
      ]),
    ]
    downloadCSV(rows, 'trial-conversion.csv')
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-gray-400">{t.hr_analytics.loading}</div>
    )
  }

  const totalTrials = subjectConv.reduce((s, r) => s + r.trials, 0)
  const totalConverted = subjectConv.reduce((s, r) => s + r.enrolled, 0)
  const overallRate = totalTrials > 0 ? Math.round((totalConverted / totalTrials) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-2xl font-bold text-gray-900">{totalTrials}</p>
          <p className="text-xs text-gray-500 mt-1">{t.hr_analytics.total_trials}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-2xl font-bold text-gray-900">{totalConverted}</p>
          <p className="text-xs text-gray-500 mt-1">{t.hr_analytics.converted}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-2xl font-bold" style={{ color: overallRate >= 50 ? '#1E8449' : '#B7770D' }}>
            {overallRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{t.hr_analytics.overall_rate}</p>
        </div>
      </div>

      {/* Trial conversion by subject */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">{t.hr_analytics.conversion_by_subject}</h3>
          </div>
          <button onClick={exportConversionCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            <Download className="w-3.5 h-3.5" /> {t.hr_analytics.export_csv}
          </button>
        </div>
        <div className="p-5 space-y-3">
          {subjectConv.map(r => {
            const meta = SUBJECT_META[r.subject]
            return (
              <div key={r.subject}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ color: meta.color, background: meta.bg }}>
                    {meta.label}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{r.enrolled}/{r.trials} {t.hr_analytics.converted_label}</span>
                    <span className="font-bold tabular-nums w-8 text-right" style={{ color: meta.color }}>{r.rate}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${r.rate}%`, backgroundColor: meta.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Monthly enrollment summary */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">{t.hr_analytics.monthly_summary}</h3>
          </div>
          <button onClick={exportEnrollmentCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
            <Download className="w-3.5 h-3.5" /> {t.hr_analytics.export_csv}
          </button>
        </div>
        {monthRows.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">{t.hr_analytics.no_data}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">{t.hr_analytics.col_month}</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">
                  <span className="flex items-center justify-end gap-1"><UserPlus className="w-3 h-3" />{t.hr_analytics.col_new_students}</span>
                </th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">{t.hr_analytics.col_trials}</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">
                  <span className="flex items-center justify-end gap-1"><TrendingUp className="w-3 h-3" />{t.hr_analytics.col_converted}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {monthRows.map(r => (
                <tr key={r.month} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{getMonthLabel(r.month)}</td>
                  <td className="px-4 py-3.5 text-right tabular-nums">
                    <span className="font-semibold text-[#1A5276]">{r.newStudents}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-gray-500">{r.trialCount}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    <span className="font-semibold text-[#1E8449]">{r.enrolledCount}</span>
                    {r.trialCount > 0 && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({Math.round((r.enrolledCount / r.trialCount) * 100)}%)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
