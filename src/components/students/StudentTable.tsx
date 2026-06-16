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
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'
import type { Student } from '@/types'
import { TIER_COLORS, TIER_CATEGORY } from '@/types'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const FILTER_TABS = ['All', 'Foundation', 'Robotics', 'Creative', 'Specialist'] as const

export function StudentTable({ students }: { students: Student[] }) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('All')

  const filtered = useMemo(() => {
    if (categoryFilter === 'All') return students
    return students.filter(s => TIER_CATEGORY[s.tier] === categoryFilter)
  }, [students, categoryFilter])

  const columns: ColumnDef<Student>[] = [
    {
      accessorKey: 'name',
      header: 'Student',
      cell: ({ row }) => {
        const s = row.original
        const color = TIER_COLORS[s.tier] || '#6B7280'
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{ backgroundColor: color }}
            >
              {getInitials(s.name)}
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">{s.name}</p>
              <p className="text-xs text-gray-500">Age {s.age}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'tier',
      header: 'Tier',
      cell: ({ getValue }) => <span className="text-sm text-gray-700">{getValue() as string}</span>,
    },
    {
      accessorKey: 'branch',
      header: 'Branch',
      cell: ({ getValue }) => <span className="text-sm text-gray-600">{getValue() as string}</span>,
    },
    {
      accessorKey: 'module_current',
      header: 'Progress',
      cell: ({ row }) => {
        const s = row.original
        const pct = s.module_total > 0 ? (s.module_current / s.module_total) * 100 : 0
        return (
          <div className="min-w-[100px]">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Module {s.module_current}</span>
              <span>{s.module_total}</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        )
      },
    },
    {
      accessorKey: 'enrolled_date',
      header: 'Enrolled',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
          {getValue() as string}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Link href={`/students/${row.original.id}`}>
          <Button size="sm" variant="outline" className="text-xs h-7 px-2">View</Button>
        </Link>
      ),
    },
  ]

  const table = useReactTable({
    data: filtered,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search students…"
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
        <TabsList className="bg-gray-100">
          {FILTER_TABS.map(t => (
            <TabsTrigger key={t} value={t} className="text-xs">{t}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
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
          <tbody className="divide-y divide-gray-100">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 text-sm">
                  No students found.
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

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {filtered.length} student{filtered.length !== 1 ? 's' : ''}
          {categoryFilter !== 'All' && ` in ${categoryFilter}`}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-2 text-xs">
            Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
          </span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
