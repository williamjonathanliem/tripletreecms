'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StudentForm } from './StudentForm'
import type { Student } from '@/types'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

export function EditStudentDialog({ student }: { student: Student }) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Pencil className="w-4 h-4" /> {t.common.edit}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.students.edit_dialog_title}</DialogTitle>
          </DialogHeader>
          <StudentForm student={student} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
