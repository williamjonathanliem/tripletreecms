'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Exposed so login/forms can trigger it on programmatic navigation
export function startNavProgress() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nav:start'))
  }
}

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [width, setWidth] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'running' | 'finishing'>('idle')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPath = useRef<string | null>(null)

  function clearAll() {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
    if (hideRef.current) { clearTimeout(hideRef.current); hideRef.current = null }
  }

  function begin() {
    clearAll()
    setPhase('running')
    setWidth(0)

    // Quick burst to 20% on next frame so it feels instant, then logarithmic crawl
    requestAnimationFrame(() => {
      setWidth(20)
      let w = 20
      intervalRef.current = setInterval(() => {
        w += (88 - w) * 0.06 + 0.4
        if (w >= 88) { w = 88; clearAll() }
        setWidth(w)
      }, 150)
    })
  }

  function finish() {
    clearAll()
    setPhase('finishing')
    setWidth(100)
    hideRef.current = setTimeout(() => {
      setPhase('idle')
      setWidth(0)
    }, 500)
  }

  // Listen for link clicks
  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest('a')
      if (!a) return
      const href = a.getAttribute('href') ?? ''
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return
      // Same page — don't start
      if (href === window.location.pathname) return
      begin()
    }

    function onNavStart() { begin() }

    document.addEventListener('click', onLinkClick)
    window.addEventListener('nav:start', onNavStart)
    return () => {
      document.removeEventListener('click', onLinkClick)
      window.removeEventListener('nav:start', onNavStart)
      clearAll()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Detect route change = navigation complete
  useEffect(() => {
    const current = pathname + searchParams.toString()
    if (prevPath.current === null) { prevPath.current = current; return }
    if (current === prevPath.current) return
    prevPath.current = current
    // Only finish if we were running
    if (phase !== 'idle') finish()
  }, [pathname, searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === 'idle') return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      style={{ height: 2 }}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          background: 'linear-gradient(90deg, #1E8449, #2ecc71)',
          boxShadow: '0 0 8px rgba(46,204,113,0.5)',
          transition: phase === 'finishing'
            ? 'width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.4s ease'
            : width <= 20
            ? 'width 0.15s ease-out'
            : 'width 0.2s ease-out',
          opacity: phase === 'finishing' ? 0 : 1,
        }}
      />
    </div>
  )
}
