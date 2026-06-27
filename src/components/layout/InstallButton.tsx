'use client'

import { useEffect, useState } from 'react'
import { Download, CheckCircle2, Info } from 'lucide-react'
import { useCmsLang } from '@/lib/context/cms-lang-context'
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallState = 'installable' | 'installed' | 'ios' | 'android' | 'firefox' | 'unsupported'

export function InstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [state, setState] = useState<InstallState>('unsupported')
  const { lang } = useCmsLang()

  const labels = {
    en: {
      install: 'Install App',
      installed: 'App Installed',
      ios: 'Install App',
      android: 'Install App',
      firefox: 'Install App',
      unsupported: 'Install App',
      ios_tip: "In Safari: tap the Share button → 'Add to Home Screen'.",
      android_tip: "Tap your browser menu (⋮ or ⋯) → 'Add to Home Screen' or 'Install App'.",
      firefox_tip: "In Firefox: click the install icon (⊕) in the address bar, or open the menu → 'Install'.",
      unsupported_tip: 'Open in Chrome, Edge, or Firefox to install this app on your device.',
    },
    zh: {
      install: '安装应用',
      installed: '已安装',
      ios: '安装应用',
      android: '安装应用',
      firefox: '安装应用',
      unsupported: '安装应用',
      ios_tip: "在 Safari 中：点击分享按钮 → '添加到主屏幕'。",
      android_tip: "点击浏览器菜单（⋮ 或 ⋯）→ '添加到主屏幕' 或 '安装应用'。",
      firefox_tip: "在 Firefox 中：点击地址栏中的安装图标（⊕），或打开菜单 → '安装'。",
      unsupported_tip: '请在 Chrome、Edge 或 Firefox 浏览器中打开以安装此应用。',
    },
  }
  const l = labels[lang]

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setState('installed')
      return
    }

    const ua = navigator.userAgent
    if (/iphone|ipad|ipod/i.test(ua)) { setState('ios'); return }
    if (/firefox/i.test(ua)) { setState('firefox'); return }
    if (/android/i.test(ua)) { setState('android') }

    function onBeforeInstall(e: Event) {
      e.preventDefault()
      const evt = e as BeforeInstallPromptEvent
      setPrompt(evt)
      setState('installable')
    }

    function onInstalled() {
      setState('installed')
      setPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function handleClick() {
    if (state === 'installable' && prompt) {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') setState('installed')
    } else if (state === 'ios') {
      toast.info(l.ios_tip, { duration: 7000 })
    } else if (state === 'android') {
      toast.info(l.android_tip, { duration: 7000 })
    } else if (state === 'firefox') {
      toast.info(l.firefox_tip, { duration: 7000 })
    } else if (state === 'unsupported') {
      toast.info(l.unsupported_tip, { duration: 7000 })
    }
  }

  const isInstalled = state === 'installed'

  return (
    <button
      onClick={handleClick}
      disabled={isInstalled}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium w-full transition-colors disabled:cursor-default"
      style={{
        color: isInstalled ? '#6B7280' : '#1A5276',
      }}
      onMouseEnter={e => { if (!isInstalled) (e.currentTarget as HTMLElement).style.background = '#EFF6FF' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {isInstalled
        ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500" />
        : state === 'ios' || state === 'unsupported'
          ? <Info className="w-4 h-4 shrink-0" />
          : <Download className="w-4 h-4 shrink-0" />
      }
      <span>{
        state === 'installable' ? l.install :
        state === 'installed'   ? l.installed :
        state === 'ios'         ? l.ios :
        state === 'android'     ? l.android :
        state === 'firefox'     ? l.firefox :
        l.unsupported
      }</span>
      {!isInstalled && (
        <span className="ml-auto text-[10px] font-bold bg-[#1A5276] text-white px-1.5 py-0.5 rounded-full">PWA</span>
      )}
      {isInstalled && (
        <span className="ml-auto text-[10px] font-semibold text-green-600">✓</span>
      )}
    </button>
  )
}
