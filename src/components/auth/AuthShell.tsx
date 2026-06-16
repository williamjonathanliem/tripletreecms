import { GraduationCap } from 'lucide-react'

export function AuthShell({ children }: { children: React.ReactNode }) {
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

      {/* Bokeh glows */}
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
      </div>

      {/* Logo */}
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
          {children}
        </div>
      </div>
    </div>
  )
}
