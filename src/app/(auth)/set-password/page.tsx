'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations'
import { AuthShell } from '@/components/auth/AuthShell'

export default function SetPasswordPage() {
  const [show, setShow] = useState({ password: false, confirm: false })
  const [serverError, setServerError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) })

  async function onSubmit(data: ResetPasswordInput) {
    setServerError('')
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) { setServerError(error.message); return }
    router.push('/dashboard')
    router.refresh()
  }

  const inputStyle = (hasError: boolean) => ({
    background: 'rgba(255,255,255,0.08)',
    border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.15)',
    color: 'white',
  })

  return (
    <AuthShell>
      <div className="mb-7">
        <h1 className="text-[1.35rem] font-bold text-white leading-tight mb-1">
          Welcome aboard
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Set your password to access Triple Tree CMS.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {serverError && (
          <div className="text-sm px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(254,202,202,1)' }}>
            {serverError}
          </div>
        )}

        <div>
          <div className="relative">
            <input
              type={show.password ? 'text' : 'password'}
              placeholder="New password"
              autoComplete="new-password"
              {...register('password')}
              className="w-full h-11 px-4 pr-11 text-sm rounded-xl outline-none"
              style={inputStyle(!!errors.password)}
            />
            <button type="button" onClick={() => setShow(s => ({ ...s, password: !s.password }))}
              className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {show.password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs mt-1.5" style={{ color: 'rgba(252,165,165,0.9)' }}>{errors.password.message}</p>
          )}
        </div>

        <div>
          <div className="relative">
            <input
              type={show.confirm ? 'text' : 'password'}
              placeholder="Confirm password"
              autoComplete="new-password"
              {...register('confirmPassword')}
              className="w-full h-11 px-4 pr-11 text-sm rounded-xl outline-none"
              style={inputStyle(!!errors.confirmPassword)}
            />
            <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
              className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs mt-1.5" style={{ color: 'rgba(252,165,165,0.9)' }}>{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 mt-1"
          style={{ background: '#1E8449' }}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set Password & Continue'}
        </button>
      </form>
    </AuthShell>
  )
}
