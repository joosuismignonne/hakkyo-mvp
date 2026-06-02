import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Lang } from '../types'

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (ko: string, en: string, fr: string) => string
}

const Ctx = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  t: (_, en) => en,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem('hakkyo_lang')
    return (saved as Lang) || 'en'
  })

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('hakkyo_lang', l)
  }

  const t = (ko: string, en: string, fr: string): string => {
    if (lang === 'ko') return ko
    if (lang === 'fr') return fr
    return en
  }

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)
