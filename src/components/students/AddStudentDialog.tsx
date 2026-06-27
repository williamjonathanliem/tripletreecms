'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StudentForm } from './StudentForm'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

export function AddStudentDialog() {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-[#1E8449] hover:bg-[#196F3D]">
        <Plus className="w-4 h-4 mr-2" />{t.students.add_student}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.students.add_dialog_title}</DialogTitle>
          </DialogHeader>
          <StudentForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
