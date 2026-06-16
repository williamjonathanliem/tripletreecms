'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { feedbackSchema, type FeedbackInput } from '@/lib/validations'

interface SessionOption {
  id: string
  session_date: string
  session_time: string
  class: { id: string; tier: string; branch: string } | null
}

const STEP_COLOR = '#1E8449'

function Step({ n, label, optional }: { n: number; label: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: STEP_COLOR }}>
        {n}
      </div>
      <span className="text-sm font-semibold text-gray-800">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-gray-400">(optional)</span>}
      </span>
    </div>
  )
}

const textareaBase = "w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1E8449] focus:bg-white transition-colors"

export function FeedbackForm({ sessions, defaultSessionId }: { sessions: SessionOption[]; defaultSessionId?: string }) {
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<FeedbackInput>({
      resolver: zodResolver(feedbackSchema),
      defaultValues: { class_id: defaultSessionId ?? '', how_was_class: '', topics_covered: '', other_comments: '' },
    })

  useEffect(() => {
    if (defaultSessionId) setValue('class_id', defaultSessionId)
  }, [defaultSessionId, setValue])

  async function onSubmit(data: FeedbackInput) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('class_feedback').insert({
      ...data, teacher_id: user.id, other_comments: data.other_comments || null,
    })
    if (error) { toast.error('Failed to save feedback'); return }
    toast.success('Feedback logged')
    reset({ class_id: '' })
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">New Entry</p>
        <h2 className="text-base font-bold text-gray-900 mt-0.5">Log a Session</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Session selector */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: STEP_COLOR }}>
              0
            </div>
            <span className="text-sm font-semibold text-gray-800">Which session?</span>
          </div>
          <Select value={watch('class_id')} onValueChange={(v: string | null) => { if (v) setValue('class_id', v, { shouldValidate: true }) }}>
            <SelectTrigger className="bg-gray-50 border-gray-200 rounded-xl h-11 focus:border-[#1E8449] focus:ring-0 focus:outline-none">
              <SelectValue placeholder="Select a session…" />
            </SelectTrigger>
            <SelectContent>
              {(sessions ?? []).map(s => {
                const cls = s.class as { tier: string; branch: string } | null
                return (
                  <SelectItem key={s.id} value={s.id}>
                    {cls?.tier ?? '—'} · {cls?.branch ?? '—'} · {s.session_date} {s.session_time.slice(0, 5)}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {errors.class_id && <p className="text-xs text-red-500 mt-1.5">{errors.class_id.message}</p>}
        </div>

        <div className="border-t border-gray-50" />

        {/* How was the class */}
        <div>
          <Step n={1} label="How was the class?" />
          <textarea
            {...register('how_was_class')}
            rows={3}
            placeholder="Overall vibe — student engagement, energy, focus, behaviour…"
            className={textareaBase}
          />
          {errors.how_was_class && <p className="text-xs text-red-500 mt-1.5">{errors.how_was_class.message}</p>}
        </div>

        {/* Topics covered */}
        <div>
          <Step n={2} label="Topics Covered" />
          <textarea
            {...register('topics_covered')}
            rows={2}
            placeholder="Which module or activities did you go through today?"
            className={textareaBase}
          />
          {errors.topics_covered && <p className="text-xs text-red-500 mt-1.5">{errors.topics_covered.message}</p>}
        </div>

        {/* Other comments */}
        <div>
          <Step n={3} label="Other Comments" optional />
          <textarea
            {...register('other_comments')}
            rows={2}
            placeholder="Issues, incidents, follow-ups, or anything worth noting…"
            className={textareaBase}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: '#1E8449' }}
          onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLElement).style.background = '#196F3D' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1E8449' }}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Feedback
        </button>
      </form>
    </div>
  )
}
