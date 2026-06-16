'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    setServerError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) {
      setServerError(
        error.message.includes('Email not confirmed')
          ? 'Please verify your email before logging in.'
          : 'Invalid email or password.'
      )
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(145deg, #071a0e 0%, #0d3320 30%, #155c37 60%, #0a2416 100%)',
        }}
      />

      {/* Atmospheric bokeh glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 65%)',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute top-1/2 -right-24 w-[420px] h-[420px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 65%)',
            filter: 'blur(55px)',
          }}
        />
        <div
          className="absolute -bottom-24 left-1/3 w-[380px] h-[380px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(74,222,128,0.14) 0%, transparent 65%)',
            filter: 'blur(50px)',
          }}
        />
        <div
          className="absolute top-16 right-1/3 w-56 h-56 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(167,243,208,0.08) 0%, transparent 70%)',
            filter: 'blur(30px)',
          }}
        />
      </div>

      {/* Logo — top left */}
      <div className="absolute top-6 left-7 z-20 flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <span className="text-white/80 text-sm font-semibold tracking-wide">Triple Tree CMS</span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[360px] mx-5">
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)',
          }}
        >
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="text-center mb-7">
            <h1 className="text-[1.35rem] font-bold text-white leading-tight mb-1">
              Sign in with email
            </h1>
            <p className="text-white/45 text-sm">Teacher portal — Triple Tree Enrichment</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            {serverError && (
              <div
                className="text-sm px-3 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(239,68,68,0.18)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: 'rgba(254,202,202,1)',
                }}
              >
                {serverError}
              </div>
            )}

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                {...register('email')}
                className="w-full h-11 px-4 text-sm rounded-xl outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: errors.email
                    ? '1px solid rgba(239,68,68,0.5)'
                    : '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                }}
                onFocus={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.13)'
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.35)'
                }}
                onBlur={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                  e.currentTarget.style.border = errors.email
                    ? '1px solid rgba(239,68,68,0.5)'
                    : '1px solid rgba(255,255,255,0.15)'
                }}
              />
              {errors.email && (
                <p className="text-xs mt-1.5" style={{ color: 'rgba(252,165,165,0.9)' }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="w-full h-11 px-4 pr-11 text-sm rounded-xl outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: errors.password
                      ? '1px solid rgba(239,68,68,0.5)'
                      : '1px solid rgba(255,255,255,0.15)',
                    color: 'white',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.13)'
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.35)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.border = errors.password
                      ? '1px solid rgba(239,68,68,0.5)'
                      : '1px solid rgba(255,255,255,0.15)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs mt-1.5" style={{ color: 'rgba(252,165,165,0.9)' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end pt-0.5">
              <Link
                href="/forgot-password"
                className="text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e =>
                  ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)')
                }
                onMouseLeave={e =>
                  ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)')
                }
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 mt-1"
              style={{ background: '#1E8449' }}
              onMouseEnter={e => {
                if (!isSubmitting)
                  (e.currentTarget as HTMLElement).style.background = '#196F3D'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = '#1E8449'
              }}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Started'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
