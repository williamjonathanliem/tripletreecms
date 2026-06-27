'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, GraduationCap, Loader2, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { startNavProgress } from '@/components/layout/NavigationProgress'

const LABELS = {
  en: {
    brand: 'Triple Tree',
    portal: 'Parent Portal',
    subtitle: 'View your child\'s progress',
    email: 'Email address',
    password: 'Password',
    forgot: 'Forgot password?',
    submit: 'Sign In',
    teacher_link: 'Are you a teacher?',
    error_verify: 'Please verify your email before logging in.',
    error_invalid: 'Invalid email or password.',
    lang: '中文',
  },
  zh: {
    brand: 'Triple Tree',
    portal: '家长平台',
    subtitle: '查看孩子的学习进度',
    email: '邮箱地址',
    password: '密码',
    forgot: '忘记密码？',
    submit: '登录',
    teacher_link: '您是教师？',
    error_verify: '请先验证您的邮箱后再登录。',
    error_invalid: '邮箱或密码无效。',
    lang: 'EN',
  },
}

export default function ParentLoginPage() {
  const [lang, setLang] = useState<'en' | 'zh'>('en')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const l = LABELS[lang]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError(authError.message.includes('Email not confirmed') ? l.error_verify : l.error_invalid)
      return
    }
    setRedirecting(true)
    startNavProgress()
    router.push('/portal')
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'white',
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background — warm green tones */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(145deg, #071a0e 0%, #0d3320 30%, #155c37 60%, #0a2416 100%)' }} />

      {/* Bokeh glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.18) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 left-1/4 w-[420px] h-[420px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 65%)', filter: 'blur(55px)' }} />
      </div>

      {/* Redirect overlay */}
      {redirecting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3"
          style={{ background: 'rgba(7,26,14,0.7)', backdropFilter: 'blur(8px)' }}>
          <Loader2 className="w-7 h-7 text-white animate-spin" />
          <p className="text-white/70 text-sm font-medium">Signing you in…</p>
        </div>
      )}

      {/* Logo */}
      <div className="absolute top-6 left-7 z-20 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <span className="text-white/80 text-sm font-semibold">{l.brand}</span>
      </div>

      {/* Language toggle */}
      <div className="absolute top-6 right-7 z-20">
        <button onClick={() => setLang(v => v === 'en' ? 'zh' : 'en')}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)' }}>
          {l.lang}
        </button>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[360px] mx-5">
        <div className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', boxShadow: '0 32px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)' }}>

          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>

          <div className="text-center mb-7">
            <h1 className="text-[1.35rem] font-bold text-white leading-tight mb-1">{l.portal}</h1>
            <p className="text-white/45 text-sm">{l.subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="text-sm px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(254,202,202,1)' }}>
                {error}
              </div>
            )}

            <input type="email" placeholder={l.email} value={email} onChange={e => setEmail(e.target.value)}
              required autoComplete="email"
              className="w-full h-11 px-4 text-sm rounded-xl outline-none transition-all"
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.35)' }}
              onBlur={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.15)' }} />

            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} placeholder={l.password} value={password}
                onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                className="w-full h-11 px-4 pr-11 text-sm rounded-xl outline-none transition-all"
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.35)' }}
                onBlur={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.border = '1px solid rgba(255,255,255,0.15)' }} />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end pt-0.5">
              <Link href="/forgot-password" className="text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)')}>
                {l.forgot}
              </Link>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 mt-1"
              style={{ background: '#1E8449' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = '#196F3D' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1E8449' }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : l.submit}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link href="/login" className="text-xs transition-colors" style={{ color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)')}>
              {l.teacher_link}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
