'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StudentForm } from './StudentForm'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

export function AddStudentDialog() {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]
  const [open, setOpen] = useState(false)

  // Prevent body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-[#1E8449] hover:bg-[#196F3D]">
        <Plus className="w-4 h-4 mr-2" />{t.students.add_student}
      </Button>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
      />

      {/* Slide-over panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-[580px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t.students.add_student}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Fill in the details below to enrol a new student</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="flex-1 overflow-y-auto">
          {open && <StudentForm onClose={() => setOpen(false)} />}
        </div>
      </div>
    </>
  )
}
