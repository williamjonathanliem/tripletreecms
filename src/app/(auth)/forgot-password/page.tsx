'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations'
import { AuthShell } from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: standardSchemaResolver(forgotPasswordSchema) })

  async function onSubmit(data: ForgotPasswordInput) {
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
    setSent(true)
  }

  if (sent) {
    return (
      <AuthShell>
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle2 className="w-10 h-10" style={{ color: 'rgba(134,239,172,0.9)' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white mb-1">Check your email</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              If this email is registered, you&apos;ll receive a reset link shortly.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <div className="mb-7">
        <h1 className="text-[1.35rem] font-bold text-white leading-tight mb-1">Forgot password?</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            {...register('email')}
            className="w-full h-11 px-4 text-sm rounded-xl outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: errors.email ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.15)',
              color: 'white',
            }}
          />
          {errors.email && (
            <p className="text-xs mt-1.5" style={{ color: 'rgba(252,165,165,0.9)' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: '#1E8449' }}
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
        </button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm pt-1 transition-colors"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to login
        </Link>
      </form>
    </AuthShell>
  )
}
