import { useState, useEffect } from 'react'
import { useLang } from '../context/LangContext'
import { supabase, isConfigured } from '../lib/supabase'
import type { Lang } from '../types'

type SiteSettings = {
  instagram?: string | null
  email?: string | null
  location?: string | null
  location_ko?: string | null
  location_en?: string | null
  location_fr?: string | null
  footer_text_ko?: string | null
  footer_text_en?: string | null
  footer_text_fr?: string | null
}

const DEFAULTS = {
  email: 'hello@hakkyo.ca',
  instagram: '@hakkyo.mtl',
  location: { ko: 'Montréal', en: 'Montréal', fr: 'Montréal' } as Record<Lang, string>,
  footerText: {
    ko: 'A Montréal community built around language and conversation.',
    en: 'A Montréal community built around language and conversation.',
    fr: 'A Montréal community built around language and conversation.',
  } as Record<Lang, string>,
}

function pickByLang(
  lang: Lang,
  ko?: string | null,
  en?: string | null,
  fr?: string | null,
): string {
  const value = lang === 'ko' ? ko : lang === 'fr' ? fr : en
  return value?.trim() ?? ''
}

function resolveLocation(settings: SiteSettings | null, lang: Lang): string {
  if (settings) {
    const localized = pickByLang(
      lang,
      settings.location_ko,
      settings.location_en,
      settings.location_fr,
    )
    if (localized) return localized
    if (settings.location?.trim()) return settings.location.trim()
  }
  return DEFAULTS.location[lang]
}

function resolveFooterText(settings: SiteSettings | null, lang: Lang): string {
  if (settings) {
    const localized = pickByLang(
      lang,
      settings.footer_text_ko,
      settings.footer_text_en,
      settings.footer_text_fr,
    )
    if (localized) return localized
  }
  return DEFAULTS.footerText[lang]
}

function instagramHref(handle: string): string {
  const raw = handle.trim()
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw
  const username = raw.replace(/^@/, '')
  return `https://instagram.com/${username}`
}

async function loadSiteSettings(): Promise<SiteSettings | null> {
  if (!isConfigured || !supabase) return null
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error(error)
    return null
  }
  return data as SiteSettings | null
}

export default function Footer() {
  const { lang } = useLang()
  const [settings, setSettings] = useState<SiteSettings | null>(null)

  useEffect(() => {
    loadSiteSettings().then(setSettings)
  }, [])

  const email = settings?.email?.trim() || DEFAULTS.email
  const instagram = settings?.instagram?.trim() || DEFAULTS.instagram
  const location = resolveLocation(settings, lang)
  const footerText = resolveFooterText(settings, lang)

  return (
    <footer className="border-t border-gray-100 mt-16">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900">HAKKYO</span>
          <span>{location}</span>
        </div>
        <div className="flex items-center gap-4">
          <a href={`mailto:${email}`} className="hover:text-gray-700 transition-colors">
            {email}
          </a>
          <a
            href={instagramHref(instagram)}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 transition-colors"
          >
            {instagram.startsWith('@') ? instagram : `@${instagram.replace(/^@/, '')}`}
          </a>
          <span>{footerText}</span>
        </div>
      </div>
    </footer>
  )
}
