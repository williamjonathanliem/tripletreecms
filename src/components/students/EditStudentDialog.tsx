'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StudentForm } from './StudentForm'
import type { Student } from '@/types'

export function EditStudentDialog({ student }: { student: Student }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Pencil className="w-4 h-4" /> Edit
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <StudentForm student={student} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
