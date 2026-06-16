'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const schema = z.object({ name: z.string().min(1, 'Name is required') })

const inputClass = "w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1E8449] focus:bg-white transition-colors"

export function ProfileForm({ teacherName, email }: { teacherName: string; email: string }) {
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } =
    useForm({ resolver: zodResolver(schema), defaultValues: { name: teacherName } })

  async function onSubmit(data: { name: string }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('teachers').update({ name: data.name }).eq('id', user.id)
    if (error) { toast.error('Failed to update profile'); return }
    toast.success('Profile updated')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Full Name</label>
        <input {...register('name')} placeholder="Your name" className={inputClass} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</label>
        <input value={email} disabled className={`${inputClass} opacity-50 cursor-not-allowed`} />
        <p className="text-xs text-gray-400">Email address cannot be changed.</p>
      </div>
      <button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
        style={{ background: '#1E8449' }}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Save Changes
      </button>
    </form>
  )
}
