'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validations'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

export function ChangePasswordForm() {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const FIELDS = [
    { key: 'current', label: t.profile.current_password, reg: 'currentPassword' as const },
    { key: 'new',     label: t.profile.new_password,     reg: 'newPassword' as const },
    { key: 'confirm', label: t.profile.confirm_password, reg: 'confirmPassword' as const },
  ]

  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const supabase = createClient()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<ChangePasswordInput>({ resolver: standardSchemaResolver(changePasswordSchema) })

  async function onSubmit(data: ChangePasswordInput) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email ?? '',
      password: data.currentPassword,
    })
    if (signInError) { toast.error('Current password is incorrect'); return }

    const { error } = await supabase.auth.updateUser({ password: data.newPassword })
    if (error) { toast.error('Failed to update password'); return }

    toast.success('Password updated successfully')
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {FIELDS.map(({ key, label, reg }) => (
        <div key={key} className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</label>
          <div className="relative">
            <input
              type={show[key as keyof typeof show] ? 'text' : 'password'}
              placeholder="••••••••"
              {...register(reg)}
              className="w-full h-11 px-4 pr-11 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1E8449] focus:bg-white transition-colors"
            />
            <button
              type="button"
              onClick={() => setShow(s => ({ ...s, [key]: !s[key as keyof typeof s] }))}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {show[key as keyof typeof show] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors[reg] && <p className="text-xs text-red-500">{errors[reg]?.message}</p>}
        </div>
      ))}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
        style={{ background: '#1E8449' }}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {t.profile.update_password}
      </button>
    </form>
  )
}
