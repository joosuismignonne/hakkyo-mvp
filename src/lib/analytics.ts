// GA4 analytics utility
// Measurement ID is read from VITE_GA_MEASUREMENT_ID at build time.
// Call initAnalytics() once on app start; then use trackPageView() and
// trackEvent() anywhere in the app.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined

/** Inject the gtag.js script and initialise the data layer. No-op if ID is missing. */
export function initAnalytics(): void {
  if (!MEASUREMENT_ID) return

  // Avoid double-initialisation
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

/** Send a page_view hit. Call on every route change. */
export function trackPageView(path: string): void {
  if (!MEASUREMENT_ID || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_location: window.location.origin + path,
    page_path: path,
  })
}

/** Fire a custom GA4 event. */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (!MEASUREMENT_ID || !window.gtag) return
  window.gtag('event', eventName, params ?? {})
}
