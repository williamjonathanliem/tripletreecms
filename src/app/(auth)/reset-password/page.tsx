'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations'
import { AuthShell } from '@/components/auth/AuthShell'

function PasswordInput({
  placeholder,
  show,
  onToggle,
  hasError,
  ...props
}: {
  placeholder: string
  show: boolean
  onToggle: () => void
  hasError?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className="w-full h-11 px-4 pr-11 text-sm rounded-xl outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.15)',
          color: 'white',
        }}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
        style={{ color: 'rgba(255,255,255,0.35)' }}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function ResetPasswordPage() {
  const [show, setShow] = useState({ password: false, confirm: false })
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')
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

        <div>
          <PasswordInput
            placeholder="New password"
            show={show.password}
            onToggle={() => setShow(s => ({ ...s, password: !s.password }))}
            hasError={!!errors.password}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-xs mt-1.5" style={{ color: 'rgba(252,165,165,0.9)' }}>{errors.password.message}</p>
          )}
        </div>

        <div>
          <PasswordInput
            placeholder="Confirm password"
            show={show.confirm}
            onToggle={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
            hasError={!!errors.confirmPassword}
            {...register('confirmPassword')}
          />
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
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
        </button>
      </form>
    </AuthShell>
  )
}
