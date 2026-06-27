'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PlayCircle, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { sessionSchema, type SessionInput } from '@/lib/validations'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

const labelClass = 'text-xs font-semibold uppercase tracking-wide text-gray-500'
const inputClass = 'w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:border-[#1E8449] focus:bg-white transition-colors'

interface Props {
  classId: string
  defaultTime?: string   // schedule_time from the class group
}

export function LogSessionDialog({ classId, defaultTime }: Props) {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<SessionInput>({
      resolver: standardSchemaResolver(sessionSchema),
      defaultValues: {
        session_date: today,
        session_time: defaultTime ?? '09:00',
        notes: '',
      },
    })

  async function onSubmit(data: SessionInput) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: session, error } = await supabase
      .from('class_sessions')
      .insert({ class_id: classId, teacher_id: user.id, ...data })
      .select()
      .single()

    if (error || !session) { toast.error('Failed to start session'); return }
    toast.success('Session started')
    setOpen(false)
    reset()
    router.push(`/classes/${classId}/sessions/${session.id}`)
  }

  function handleClose(v: boolean) {
    setOpen(v)
    if (!v) reset({ session_date: today, session_time: defaultTime ?? '09:00', notes: '' })
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{ background: '#1A5276' }}
      >
        <PlayCircle className="w-4 h-4" /> {t.classes.log_session_btn}
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.classes.log_session_title}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelClass}>{t.classes.date}</label>
                <input type="date" {...register('session_date')} className={inputClass} />
                {errors.session_date && <p className="text-xs text-red-500">{errors.session_date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>{t.classes.time_label}</label>
                <input type="time" {...register('session_time')} className={inputClass} />
                {errors.session_time && <p className="text-xs text-red-500">{errors.session_time.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass}>{t.classes.notes} <span className="text-gray-400 normal-case font-normal">({t.common.optional})</span></label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder={t.classes.notes_placeholder}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:border-[#1E8449] focus:bg-white transition-colors resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: '#1A5276' }}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                {t.classes.start_attendance}
              </button>
              <button type="button" onClick={() => handleClose(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                {t.common.cancel}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
