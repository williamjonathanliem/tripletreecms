'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { trialStudentSchema, type TrialStudentInput } from '@/lib/validations'
import { TIERS } from '@/types'

const labelClass = "text-xs font-semibold uppercase tracking-wide text-gray-500"
const inputClass = "w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1E8449] focus:bg-white transition-colors"

export function AddTrialDialog() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<TrialStudentInput, unknown, TrialStudentInput>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(trialStudentSchema) as any,
      defaultValues: {
        tier: '',
        trial_date: new Date().toISOString().split('T')[0],
      },
    })

  function handleClose(v: boolean) {
    setOpen(v)
    if (!v) reset()
  }

  async function onSubmit(data: TrialStudentInput) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('trial_students').insert({
      ...data,
      teacher_id: user.id,
      outcome: 'pending',
    })
    if (error) { toast.error('Failed to add trial student'); return }
    toast.success('Trial student added')
    reset()
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-[#1E8449] hover:bg-[#196F3D]">
        <Plus className="w-4 h-4 mr-2" />Add Trial
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Trial Student</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">

              {/* Student name */}
              <div className="col-span-2 space-y-1.5">
                <label className={labelClass}>Student Name</label>
                <input {...register('name')} placeholder="Full name" className={inputClass} />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              {/* Age */}
              <div className="space-y-1.5">
                <label className={labelClass}>Age</label>
                <input type="number" {...register('age')} placeholder="e.g. 8" className={inputClass} />
                {errors.age && <p className="text-xs text-red-500">{errors.age.message}</p>}
              </div>

              {/* Trial date */}
              <div className="space-y-1.5">
                <label className={labelClass}>Trial Date</label>
                <input type="date" {...register('trial_date')} className={inputClass} />
                {errors.trial_date && <p className="text-xs text-red-500">{errors.trial_date.message}</p>}
              </div>

              {/* Trial Class (tier) */}
              <div className="col-span-2 space-y-1.5">
                <label className={labelClass}>Trial Class</label>
                <Select value={watch('tier')} onValueChange={(v: string | null) => { if (v) setValue('tier', v, { shouldValidate: true }) }}>
                  <SelectTrigger className="h-11 rounded-xl border-gray-200 bg-gray-50 focus:border-[#1E8449] focus:ring-0">
                    <SelectValue placeholder="Select tier…" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.tier && <p className="text-xs text-red-500">{errors.tier.message}</p>}
              </div>

              {/* Parent name */}
              <div className="space-y-1.5">
                <label className={labelClass}>Parent / Guardian Name</label>
                <input {...register('parent_name')} placeholder="Full name" className={inputClass} />
              </div>

              {/* Parent contact */}
              <div className="space-y-1.5">
                <label className={labelClass}>Parent Contact</label>
                <input {...register('parent_contact')} placeholder="+601X-XXXXXXX" className={inputClass} />
              </div>

              {/* Notes */}
              <div className="col-span-2 space-y-1.5">
                <label className={labelClass}>Notes</label>
                <Textarea {...register('notes')} rows={2} placeholder="Any observations…" className="rounded-xl border-gray-200 bg-gray-50 focus:border-[#1E8449]" />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: '#1E8449' }}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Trial Student
              </button>
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
