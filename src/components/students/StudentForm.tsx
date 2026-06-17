'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { studentSchema, type StudentInput } from '@/lib/validations'
import { TIERS } from '@/types'
import { CURRICULUM } from '@/lib/curriculum'
import { createClient } from '@/lib/supabase/client'
import type { Student } from '@/types'

interface Props {
  student?: Student
  onClose?: () => void
}

export function StudentForm({ student, onClose }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!student

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentInput, unknown, StudentInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(studentSchema) as any,
    defaultValues: student
      ? {
          name: student.name,
          age: student.age,
          tier: student.tier,
          branch: student.branch,
          module_current: student.module_current,
          module_total: student.module_total,
          enrolled_date: student.enrolled_date,
          parent_contact: student.parent_contact ?? '',
          notes: student.notes ?? '',
        }
      : {
          module_current: 0,
          module_total: 1,
          enrolled_date: new Date().toISOString().split('T')[0],
        },
  })

  const watchedTier = watch('tier')

  async function onSubmit(data: StudentInput) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      ...data,
      teacher_id: user.id,
      module_total: CURRICULUM[data.tier]?.length ?? data.module_total,
    }

    if (isEditing) {
      const { error } = await supabase.from('students').update(payload).eq('id', student.id)
      if (error) { toast.error('Failed to update student'); return }
      toast.success('Student updated')
    } else {
      const { error } = await supabase.from('students').insert(payload)
      if (error) { toast.error('Failed to add student'); return }
      toast.success('Student added')
    }

    router.refresh()
    onClose?.()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label>Full Name</Label>
          <Input {...register('name')} placeholder="Student name" />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Age</Label>
          <Input type="number" {...register('age')} placeholder="e.g. 8" />
          {errors.age && <p className="text-xs text-red-500">{errors.age.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Enrolled Date</Label>
          <Input type="date" {...register('enrolled_date')} />
          {errors.enrolled_date && <p className="text-xs text-red-500">{errors.enrolled_date.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Tier</Label>
          <Select value={watchedTier} onValueChange={(v: string | null) => { if (v) { setValue('tier', v); setValue('module_total', CURRICULUM[v]?.length ?? 1) } }}>
            <SelectTrigger>
              <SelectValue placeholder="Select tier" />
            </SelectTrigger>
            <SelectContent>
              {TIERS.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tier && <p className="text-xs text-red-500">{errors.tier.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Branch</Label>
          <Input {...register('branch')} placeholder="e.g. PJ, Subang" />
          {errors.branch && <p className="text-xs text-red-500">{errors.branch.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Parent Contact</Label>
          <Input {...register('parent_contact')} placeholder="+601X-XXXXXXX" />
        </div>

        <div className="col-span-2 space-y-1.5">
          <Label>Notes</Label>
          <Textarea {...register('notes')} placeholder="Any notes about this student…" rows={3} />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="submit" className="bg-[#1E8449] hover:bg-[#196F3D]" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Add Student'}
        </Button>
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        )}
      </div>
    </form>
  )
}
