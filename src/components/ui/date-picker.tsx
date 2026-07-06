'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa']
const YEARS       = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - 3 + i)

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function DatePickerField({
  value,
  onChange,
  placeholder = 'Pick a date',
  triggerClassName,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0, flip: false })
  const [view, setView] = useState(() => {
    const d = value ? new Date(value + 'T00:00:00') : new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00')
      setView({ year: d.getFullYear(), month: d.getMonth() })
    }
  }, [value])

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      const target = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function openCalendar() {
    if (!triggerRef.current) { setOpen(v => !v); return }
    const rect = triggerRef.current.getBoundingClientRect()
    const dropH = 340
    const flip = rect.bottom + dropH > window.innerHeight && rect.top > dropH
    setPos({ top: flip ? rect.top : rect.bottom, left: rect.left, flip })
    setOpen(v => !v)
  }

  const today    = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  function cells() {
    const first = new Date(view.year, view.month, 1).getDay()
    const total = new Date(view.year, view.month + 1, 0).getDate()
    const out: (number | null)[] = Array(first).fill(null)
    for (let d = 1; d <= total; d++) out.push(d)
    while (out.length % 7 !== 0) out.push(null)
    return out
  }

  function selectDay(day: number) {
    const m = String(view.month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${view.year}-${m}-${d}`)
    setOpen(false)
  }

  const defaultTrigger = 'flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm text-left transition-colors hover:border-gray-300 focus:outline-none'

  const dropdown = (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: pos.flip ? undefined : pos.top + 4,
        bottom: pos.flip ? window.innerHeight - pos.top + 4 : undefined,
        left: pos.left,
        zIndex: 9999,
      }}
      className="rounded-xl border border-gray-100 bg-white shadow-xl p-3 w-[272px]"
    >
      {/* Header */}
      <div className="flex items-center gap-1 mb-2">
        <button type="button"
          onClick={() => setView(v => v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 })}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        </button>

        <div className="flex-1">
          <select
            value={view.month}
            onChange={e => setView(v => ({ ...v, month: parseInt(e.target.value) }))}
            className="w-full appearance-none bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-semibold px-2 h-8 outline-none cursor-pointer border-0 text-gray-800"
          >
            {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>

        <div className="w-[70px]">
          <select
            value={view.year}
            onChange={e => setView(v => ({ ...v, year: parseInt(e.target.value) }))}
            className="w-full appearance-none bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-semibold px-2 h-8 outline-none cursor-pointer border-0 text-gray-800"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <button type="button"
          onClick={() => setView(v => v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 })}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-[10px] font-semibold text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {cells().map((day, i) => {
          if (!day) return <div key={i} className="h-8" />
          const m      = String(view.month + 1).padStart(2, '0')
          const d      = String(day).padStart(2, '0')
          const dayStr = `${view.year}-${m}-${d}`
          const isSel  = dayStr === value
          const isTod  = dayStr === todayStr
          return (
            <button key={i} type="button" onClick={() => selectDay(day)}
              className={`h-8 w-full rounded-lg text-sm transition-colors select-none ${
                isSel ? 'bg-gray-900 text-white font-semibold'
                  : isTod ? 'border border-gray-300 font-semibold text-gray-800 hover:bg-gray-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}>
              {day}
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex justify-between mt-2 pt-2 border-t border-gray-100">
        <button type="button"
          onClick={() => { onChange(''); setOpen(false) }}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors px-1 py-0.5">
          Clear
        </button>
        <button type="button"
          onClick={() => {
            onChange(todayStr)
            setView({ year: today.getFullYear(), month: today.getMonth() })
            setOpen(false)
          }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors px-1 py-0.5">
          Today
        </button>
      </div>
    </div>
  )

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={openCalendar}
        className={triggerClassName ?? `${defaultTrigger} h-10`}
      >
        <CalendarIcon className="w-4 h-4 text-gray-400 shrink-0" />
        {value
          ? <span className="text-gray-800">{fmt(value)}</span>
          : <span className="text-gray-400">{placeholder}</span>
        }
      </button>

      {open && mounted && createPortal(dropdown, document.body)}
    </div>
  )
}
