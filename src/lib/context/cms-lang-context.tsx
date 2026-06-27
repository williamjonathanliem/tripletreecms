'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type CmsLang = 'en' | 'zh'

const STORAGE_KEY = 'cms_lang'

interface CmsLangContextValue {
  lang: CmsLang
  setLang: (lang: CmsLang) => void
  toggle: () => void
}

const CmsLangContext = createContext<CmsLangContextValue>({
  lang: 'en',
  setLang: () => {},
  toggle: () => {},
})

export function CmsLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<CmsLang>('en')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'zh') setLangState('zh')
  }, [])

  function setLang(l: CmsLang) {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }

  function toggle() {
    setLang(lang === 'en' ? 'zh' : 'en')
  }

  return (
    <CmsLangContext.Provider value={{ lang, setLang, toggle }}>
      {children}
    </CmsLangContext.Provider>
  )
}

export function useCmsLang() {
  return useContext(CmsLangContext)
}
