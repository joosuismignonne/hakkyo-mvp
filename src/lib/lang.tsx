import { createContext, useContext, useState, useEffect } from 'react'

export type Lang = 'ko' | 'en' | 'fr'

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'ko', setLang: () => {},
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem('hakkyo_lang') as Lang) || 'ko'
  })
  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('hakkyo_lang', l)
  }
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}

export function pick<T extends { ko?: string; en?: string; fr?: string }>(obj: T, lang: Lang): string {
  return obj[lang] || obj.ko || obj.en || obj.fr || ''
}
