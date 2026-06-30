'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations'
import { AuthShell } from '@/components/auth/AuthShell'

function PasswordChecklist({ password, confirm }: { password: string; confirm: string }) {
  const checks = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter',  met: /[A-Z]/.test(password) },
    { label: 'One number',            met: /[0-9]/.test(password) },
    { label: 'Passwords match',       met: confirm.length > 0 && password === confirm },
  ]

  if (!password) return null

  return (
    <div className="rounded-xl px-4 py-3 space-y-1.5"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {checks.map(({ label, met }) => (
        <div key={label} className="flex items-center gap-2.5">
          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${met ? 'bg-green-500' : 'bg-white/10'}`}>
            {met
              ? <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
              : <X className="w-2.5 h-2.5 text-white/30" strokeWidth={3} />
            }
          </div>
          <span className={`text-xs transition-colors ${met ? 'text-green-400' : 'text-white/40'}`}>{label}</span>
        </div>
      ))}
    </div>
  )
}

export default function ResetPasswordPage() {
  const [show,       setShow]       = useState({ password: false, confirm: false })
  const [success,    setSuccess]    = useState(false)
  const [serverError, setServerError] = useState('')
  const [passwordVal, setPasswordVal] = useState('')
  const [confirmVal,  setConfirmVal]  = useState('')
  const router = useRouter()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ResetPasswordInput>({ resolver: standardSchemaResolver(resetPasswordSchema) })

  async function onSubmit(data: ResetPasswordInput) {
    setServerError('')
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) { setServerError(error.message); return }
    setSuccess(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  const allChecksMet =
    passwordVal.length >= 8 &&
    /[A-Z]/.test(passwordVal) &&
    /[0-9]/.test(passwordVal) &&
    confirmVal.length > 0 &&
    passwordVal === confirmVal

  const inputStyle = (hasError: boolean) => ({
    background: 'rgba(255,255,255,0.08)',
    border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.15)',
    color: 'white',
  })

  if (success) {
    return (
      <AuthShell>
        <div className="text-center space-y-4 py-2">
          <CheckCircle2 className="w-10 h-10 mx-auto" style={{ color: 'rgba(134,239,172,0.9)' }} />
          <div>
            <p className="font-bold text-white mb-1">Password updated</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Redirecting to login in 3 seconds…
            </p>
          </div>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="mb-7">
        <h1 className="text-[1.35rem] font-bold text-white leading-tight mb-1">Reset password</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Choose a new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {serverError && (
          <div className="text-sm px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(254,202,202,1)' }}>
            {serverError}
          </div>
        )}

        {/* New password */}
        <div className="relative">
          <input
            type={show.password ? 'text' : 'password'}
            placeholder="New password"
            autoComplete="new-password"
            className="w-full h-11 px-4 pr-11 text-sm rounded-xl outline-none"
            style={inputStyle(!!errors.password)}
            {...register('password', { onChange: e => setPasswordVal(e.target.value) })}
          />
          <button type="button"
            onClick={() => setShow(s => ({ ...s, password: !s.password }))}
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(255,255,255,0.35)' }}>
            {show.password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Confirm password */}
        <div className="relative">
          <input
            type={show.confirm ? 'text' : 'password'}
            placeholder="Confirm password"
            autoComplete="new-password"
            className="w-full h-11 px-4 pr-11 text-sm rounded-xl outline-none"
            style={inputStyle(!!errors.confirmPassword)}
            {...register('confirmPassword', { onChange: e => setConfirmVal(e.target.value) })}
          />
          <button type="button"
            onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
            className="absolute right-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'rgba(255,255,255,0.35)' }}>
            {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Live checklist */}
        <PasswordChecklist password={passwordVal} confirm={confirmVal} />

        <button
          type="submit"
          disabled={isSubmitting || !allChecksMet}
          className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-1 transition-all"
          style={{
            background: allChecksMet ? '#1E8449' : 'rgba(255,255,255,0.08)',
            color: allChecksMet ? 'white' : 'rgba(255,255,255,0.3)',
            cursor: allChecksMet ? 'pointer' : 'not-allowed',
          }}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
        </button>
      </form>
    </AuthShell>
  )
}
