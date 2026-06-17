// analytics.ts — two-layer tracking
// Layer 1: GA4 via gtag (page views, kept for backward compat)
// Layer 2: Supabase event_logs (custom button/action events)

import { supabase, isConfigured } from './supabase'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

// ─── GA4 ──────────────────────────────────────────────────────────────────────

export function initAnalytics(): void {
  if (!MEASUREMENT_ID) return
  if (document.getElementById('gtag-script')) return

  window.dataLayer = window.dataLayer ?? []
  window.gtag = function (...args: unknown[]) {
    window.dataLayer!.push(args)
  }
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false })

  const script = document.createElement('script')
  script.id = 'gtag-script'
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)
}

export function trackPageView(path: string): void {
  if (!MEASUREMENT_ID || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_location: window.location.origin + path,
    page_path: path,
  })
}

// ─── Supabase event_logs ──────────────────────────────────────────────────────

export interface TrackEventParams {
  eventName: string
  targetType?: string
  targetId?: string
  targetLabel?: string
  userId?: string | null
  metadata?: Record<string, unknown>
}

export async function trackEvent(params: TrackEventParams): Promise<void> {
  if (!isConfigured || !supabase) return
  try {
    await supabase.from('event_logs').insert({
      event_name:   params.eventName,
      page_path:    window.location.pathname,
      target_type:  params.targetType  ?? null,
      target_id:    params.targetId    ?? null,
      target_label: params.targetLabel ?? null,
      user_id:      params.userId      ?? null,
      metadata:     params.metadata    ?? {},
    })
  } catch (err) {
    console.error('[analytics] trackEvent failed:', err)
    // never throw — tracking must never break UX
  }
}
