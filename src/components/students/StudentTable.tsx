'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'
import type { Student, Subject } from '@/types'
import { TIER_COLORS, SUBJECTS, SUBJECT_META } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

type FeeKey = 'all' | 'paid' | 'unpaid' | 'partial'

const FEE_FILTERS: { key: FeeKey; label: string; color: string; bg: string }[] = [
  { key: 'all',     label: 'All',     color: '#6B7280', bg: '#F9FAFB' },
  { key: 'paid',    label: 'Paid',    color: '#1E8449', bg: '#EAFAF1' },
  { key: 'unpaid',  label: 'Unpaid',  color: '#CB4335', bg: '#FDEDEC' },
  { key: 'partial', label: 'Partial', color: '#B7770D', bg: '#FEF9E7' },
]

export function StudentTable({ students }: { students: Student[] }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState<Subject | 'all'>('all')
  const [feeFilter, setFeeFilter] = useState<FeeKey>('all')

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchSubject = subjectFilter === 'all' || s.subject === subjectFilter
      const matchFee = feeFilter === 'all' || (s.fee_status ?? 'unpaid') === feeFilter
      const matchSearch = !search || (
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.tier.toLowerCase().includes(search.toLowerCase()) ||
        s.branch.toLowerCase().includes(search.toLowerCase())
      )
      return matchSubject && matchFee && matchSearch
    })
  }, [students, subjectFilter, feeFilter, search])

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'name',
      header: t.students.col_student,
      cell: ({ row }) => {
        const s = row.original
        const color = TIER_COLORS[s.tier] || SUBJECT_META[s.subject]?.color || '#6B7280'
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{ backgroundColor: color }}>
              {getInitials(s.name)}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{s.name}</p>
              <p className="text-xs text-gray-500">{t.students.age} {s.age}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'subject',
      header: t.students.subject ?? 'Subject',
      cell: ({ getValue }) => {
        const s = getValue() as Subject
        const meta = SUBJECT_META[s]
        if (!meta) return <span className="text-xs text-gray-400">—</span>
        return (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color: meta.color, background: meta.bg }}>
            {meta.label}
          </span>
        )
      },
    },
    {
      accessorKey: 'tier',
      header: t.students.col_tier,
      cell: ({ getValue, row }) => {
        const tier = getValue() as string
        const color = TIER_COLORS[tier] || SUBJECT_META[row.original.subject]?.color || '#6B7280'
        const isTierLabel = !TIER_COLORS[tier]
        return (
          <span className="text-xs text-gray-700" style={isTierLabel ? { color } : undefined}>
            {tier}
          </span>
        )
      },
    },
    {
      accessorKey: 'branch',
      header: t.students.col_branch,
      cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue() as string}</span>,
    },
    {
      accessorKey: 'module_current',
      header: t.students.col_progress,
      cell: ({ row }) => {
        const s = row.original
        const pct = s.module_total > 0 ? (s.module_current / s.module_total) * 100 : 0
        const color = TIER_COLORS[s.tier] || SUBJECT_META[s.subject]?.color || '#6B7280'
        return (
          <div className="min-w-[90px]">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{s.module_current}/{s.module_total}</span>
              <span>{Math.round(pct)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'fee_status',
      header: t.students.col_fee,
      cell: ({ getValue }) => {
        const v = (getValue() as string) ?? 'unpaid'
        const cfg: Record<string, { label: string; color: string; bg: string }> = {
          paid:    { label: t.students.fee_paid,    color: '#1E8449', bg: '#EAFAF1' },
          unpaid:  { label: t.students.fee_unpaid,  color: '#CB4335', bg: '#FDEDEC' },
          partial: { label: t.students.fee_partial, color: '#B7770D', bg: '#FEF9E7' },
        }
        const c = cfg[v] ?? cfg.unpaid
        return (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color: c.color, background: c.bg }}>
            {c.label}
          </span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Link href={`/students/${row.original.id}`}>
          <Button size="sm" variant="outline" className="text-xs h-7 px-2">{t.common.view}</Button>
        </Link>
      ),
    },
  ]

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 12 } },
  })

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={t.students.search_placeholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Subject filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSubjectFilter('all')}
          className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
          style={subjectFilter === 'all'
            ? { background: '#1A5276', color: 'white', borderColor: '#1A5276' }
            : { background: 'white', color: '#6B7280', borderColor: '#E5E7EB' }}>
          {t.students.filter_all}
        </button>
        {SUBJECTS.map(s => {
          const meta = SUBJECT_META[s]
          const active = subjectFilter === s
          return (
            <button key={s} onClick={() => setSubjectFilter(s)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
              style={active
                ? { background: meta.bg, color: meta.color, borderColor: meta.color }
                : { background: 'white', color: '#9CA3AF', borderColor: '#E5E7EB' }}>
              {meta.label}
            </button>
          )
        })}
      </div>

      {/* Fee status filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-gray-400 font-medium">Fee:</span>
        {FEE_FILTERS.map(f => (
          <button key={f.key} onClick={() => setFeeFilter(f.key)}
            className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
            style={feeFilter === f.key
              ? { background: f.bg, color: f.color, borderColor: f.color + '60' }
              : { background: 'white', color: '#9CA3AF', borderColor: '#E5E7EB' }}>
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1.5 opacity-60">
                {students.filter(s => (s.fee_status ?? 'unpaid') === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {table.getRowModel().rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 py-10 text-center">
            <p className="text-sm text-gray-400">{t.students.no_students}</p>
          </div>
        ) : (
          table.getRowModel().rows.map(row => {
            const s = row.original
            const color = TIER_COLORS[s.tier] || SUBJECT_META[s.subject]?.color || '#6B7280'
            const pct = s.module_total > 0 ? (s.module_current / s.module_total) * 100 : 0
            const meta = SUBJECT_META[s.subject]
            const feeCfg: Record<string, { label: string; color: string; bg: string }> = {
              paid:    { label: t.students.fee_paid,    color: '#1E8449', bg: '#EAFAF1' },
              unpaid:  { label: t.students.fee_unpaid,  color: '#CB4335', bg: '#FDEDEC' },
              partial: { label: t.students.fee_partial, color: '#B7770D', bg: '#FEF9E7' },
            }
            const fc = feeCfg[s.fee_status ?? 'unpaid'] ?? feeCfg.unpaid
            return (
              <Link key={s.id} href={`/students/${s.id}`}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 active:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: color }}>
                    {getInitials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ color: fc.color, background: fc.bg }}>{fc.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400">{t.students.age} {s.age}</span>
                      {meta && (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
                      )}
                      <span className="text-xs text-gray-500">{s.tier} · {s.branch}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{s.module_current}/{s.module_total} modules</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-xl border border-gray-100 overflow-hidden bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-50">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400 text-sm">
                  {t.students.no_students}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span className="text-xs text-gray-400">
          {filtered.length} of {students.length} {t.students.count_plural}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-2 text-xs">
            {t.students.page_label} {table.getState().pagination.pageIndex + 1} {t.students.page_of} {table.getPageCount() || 1}
          </span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
