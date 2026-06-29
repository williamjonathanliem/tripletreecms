'use client'

import { useState, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordInput } from '@/lib/validations'
import { AuthShell } from '@/components/auth/AuthShell'
import { startNavProgress } from '@/components/layout/NavigationProgress'

function parseHash(hash: string): Record<string, string> {
  return Object.fromEntries(
    hash.replace(/^#/, '').split('&').map(pair => pair.split('=').map(decodeURIComponent))
  )
}

function SetPasswordForm() {
  const [show, setShow] = useState({ password: false, confirm: false })
  const [serverError, setServerError] = useState('')
  const [verifying, setVerifying] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<ResetPasswordInput>({ resolver: standardSchemaResolver(resetPasswordSchema) })

  useEffect(() => {
    async function init() {
      const hash = typeof window !== 'undefined' ? window.location.hash : ''
      const url  = typeof window !== 'undefined' ? window.location.href : ''
      console.log('[set-password] init — url:', url)
      console.log('[set-password] hash:', hash || '(none)')
      console.log('[set-password] search:', window.location.search || '(none)')

      // 1. Check URL hash (implicit flow — Supabase puts tokens here for invite links)
      if (hash) {
        const params = parseHash(hash)
        console.log('[set-password] hash params:', JSON.stringify(params))

        if (params.error) {
          const desc = params.error_description?.replace(/\+/g, ' ') ?? params.error
          console.log('[set-password] hash error:', desc)
          setServerError(
            params.error_code === 'otp_expired'
              ? 'This invite link has expired. Please ask HR to send a new invite.'
              : `Link error: ${desc}. Please ask HR to send a new invite.`
          )
          setVerifying(false)
          return
        }

        if (params.access_token) {
          console.log('[set-password] found access_token in hash — waiting for auth state change')
          await new Promise<void>((resolve) => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
              console.log('[set-password] onAuthStateChange event:', _event, 'session:', !!session)
              subscription.unsubscribe()
              if (!session) {
                setServerError('Could not verify your invite link. Please ask HR to send a new one.')
              }
              setVerifying(false)
              resolve()
            })
            setTimeout(async () => {
              subscription.unsubscribe()
              const { data: { session } } = await supabase.auth.getSession()
              console.log('[set-password] fallback getSession:', !!session)
              if (!session) {
                setServerError('Could not verify your invite link. Please ask HR to send a new one.')
              }
              setVerifying(false)
              resolve()
            }, 3000)
          })
          return
        }
      }

      // 2. Check query params (token_hash flow)
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type') as 'invite' | 'recovery' | null
      console.log('[set-password] token_hash:', tokenHash, 'type:', type)

      if (tokenHash && type) {
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        console.log('[set-password] verifyOtp result:', !!data?.session, error?.message)
        if (error || !data?.session) {
          setServerError(
            error?.message
              ? `Link error: ${error.message}. Please ask HR to send a new invite.`
              : 'Could not verify invite link. Please ask HR to send a new one.'
          )
        }
        setVerifying(false)
        return
      }

      // 3. Fallback: existing session?
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[set-password] fallback session:', !!session)
      if (!session) {
        setServerError('This link has expired or is invalid. Please ask HR to send a new invite.')
      }
      setVerifying(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function onSubmit(data: ResetPasswordInput) {
    setServerError('')
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) { setServerError(error.message); return }

    setRedirecting(true)
    startNavProgress()

    const { data: { user } } = await supabase.auth.getUser()
    const { data: teacher } = user
      ? await supabase.from('teachers').select('id').eq('id', user.id).maybeSingle()
      : { data: null }

    router.push(teacher ? '/dashboard' : '/portal')
    router.refresh()
  }

  const inputStyle = (hasError: boolean) => ({
    background: 'rgba(255,255,255,0.08)',
    border: hasError ? '1px solid rgba(239,68,68,0.5)' : '1px solid rgba(255,255,255,0.15)',
    color: 'white',
  })

  return (
    <AuthShell>
      {redirecting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3"
          style={{ background: 'rgba(7,26,14,0.75)', backdropFilter: 'blur(8px)' }}>
          <Loader2 className="w-7 h-7 text-white animate-spin" />
          <p className="text-white/70 text-sm font-medium">Setting up your account…</p>
        </div>
      )}
      <div className="mb-7">
        <h1 className="text-[1.35rem] font-bold text-white leading-tight mb-1">
          Welcome aboard
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Set your password to access Triple Tree CMS.
        </p>
      </div>

      {verifying ? (
        <div className="flex items-center justify-center gap-3 py-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Verifying your invite link…</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {serverError && (
            <div className="text-sm px-4 py-3 rounded-xl space-y-2"
              style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(254,202,202,1)' }}>
              <p>{serverError}</p>
            </div>
          )}

          {!serverError && (
            <>
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
            </>
          )}
        </form>
      )}
    </AuthShell>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthShell>
        <div className="flex items-center justify-center gap-3 py-16" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      </AuthShell>
    }>
      <SetPasswordForm />
    </Suspense>
  )
}
