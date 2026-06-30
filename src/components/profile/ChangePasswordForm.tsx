'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/validations'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { CMS_T } from '@/lib/i18n/cms'

function PasswordChecklist({ password, confirm }: { password: string; confirm: string }) {
  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter',  met: /[A-Z]/.test(password) },
    { label: 'One number',            met: /[0-9]/.test(password) },
    { label: 'Passwords match',       met: confirm.length > 0 && password === confirm },
  ]

  if (!password) return null

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5">
      {checks.map(({ label, met }) => (
        <div key={label} className="flex items-center gap-2.5">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${met ? 'bg-green-500' : 'bg-gray-200'}`}>
            {met
              ? <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              : <X className="w-2.5 h-2.5 text-gray-400" strokeWidth={3} />
            }
          </div>
          <span className={`text-xs transition-colors ${met ? 'text-green-600 font-medium' : 'text-gray-400'}`}>{label}</span>
        </div>
      ))}
    </div>
  )
}

export function ChangePasswordForm() {
  const { lang } = useCmsLang()
  const t = CMS_T[lang]

  const [show,       setShow]       = useState({ current: false, new: false, confirm: false })
  const [newVal,     setNewVal]     = useState('')
  const [confirmVal, setConfirmVal] = useState('')
  const supabase = createClient()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<ChangePasswordInput>({ resolver: standardSchemaResolver(changePasswordSchema) })

  const allChecksMet =
    newVal.length >= 8 &&
    /[A-Z]/.test(newVal) &&
    /[0-9]/.test(newVal) &&
    confirmVal.length > 0 &&
    newVal === confirmVal

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
    setNewVal('')
    setConfirmVal('')
  }

  const inp = (hasErr: boolean) =>
    `w-full h-11 px-4 pr-11 rounded-xl border text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1E8449] focus:bg-white transition-colors ${
      hasErr ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
    }`

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

      {/* Current password */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t.profile.current_password}
        </label>
        <div className="relative">
          <input
            type={show.current ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('currentPassword')}
            className={inp(!!errors.currentPassword)}
          />
          <button type="button"
            onClick={() => setShow(s => ({ ...s, current: !s.current }))}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.currentPassword && <p className="text-xs text-red-500">{errors.currentPassword.message}</p>}
      </div>

      {/* New password */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t.profile.new_password}
        </label>
        <div className="relative">
          <input
            type={show.new ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('newPassword', { onChange: e => setNewVal(e.target.value) })}
            className={inp(!!errors.newPassword)}
          />
          <button type="button"
            onClick={() => setShow(s => ({ ...s, new: !s.new }))}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {t.profile.confirm_password}
        </label>
        <div className="relative">
          <input
            type={show.confirm ? 'text' : 'password'}
            placeholder="••••••••"
            {...register('confirmPassword', { onChange: e => setConfirmVal(e.target.value) })}
            className={inp(!!errors.confirmPassword)}
          />
          <button type="button"
            onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
            {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Live checklist */}
      <PasswordChecklist password={newVal} confirm={confirmVal} />

      <button
        type="submit"
        disabled={isSubmitting || !allChecksMet}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:cursor-not-allowed"
        style={{
          background: allChecksMet ? '#1E8449' : '#E5E7EB',
          color: allChecksMet ? 'white' : '#9CA3AF',
        }}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {t.profile.update_password}
      </button>
    </form>
  )
}
