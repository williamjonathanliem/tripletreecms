'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StudentForm } from './StudentForm'

export function AddStudentDialog() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-[#1E8449] hover:bg-[#196F3D]">
        <Plus className="w-4 h-4 mr-2" />Add Student
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <StudentForm onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
