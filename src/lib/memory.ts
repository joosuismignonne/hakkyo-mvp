/**
 * memory.ts — unified recently-viewed + saved storage for HAKKYO.
 *
 * Single source of truth for all pages: Board, NEWS, Programs, Floating Archive.
 *
 * localStorage keys
 * ─────────────────
 *   hakkyo_recently_viewed   global recently viewed (all types, newest first)
 *   hakkyo_saved_items       global saved items     (all types)
 *
 * Legacy keys (migrated once on first read, then deleted)
 * ────────────────────────────────────────────────────────
 *   hakkyo_archive_recent
 *   hakkyo_archive_saved
 *
 * Custom DOM event fired on every write
 * ──────────────────────────────────────
 *   'hakkyo:memory:update'
 *
 * Item types
 * ──────────
 *   'program'  → navigates to /programs
 *   'board'    → navigates to /board
 *   'archive'  → navigates to /news/:id
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type MemoryItemType = 'program' | 'board' | 'archive'

export interface MemoryItem {
  id:    string
  type:  MemoryItemType
  title: string        // English title stored at track time
  image: string | null
  url:   string        // absolute path – always use new-style paths
  date:  string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const MEMORY_RECENT_KEY = 'hakkyo_recently_viewed'
export const MEMORY_SAVED_KEY  = 'hakkyo_saved_items'

/** DOM custom event fired after every write (recent or saved). */
export const MEMORY_UPDATE_EVENT = 'hakkyo:memory:update'

const RECENT_MAX = 20
const SAVED_MAX  = 50

// ─── Legacy key names (migrated once, then removed) ──────────────────────────

const LEGACY_KEYS: Array<[legacyKey: string, newKey: string]> = [
  ['hakkyo_archive_recent', MEMORY_RECENT_KEY],
  ['hakkyo_archive_saved',  MEMORY_SAVED_KEY],
]

// ─── URL normaliser (rewrites pre-rename paths) ───────────────────────────────

function normaliseUrl(url: string): string {
  if (url === '/schedule') return '/board'
  if (url === '/content')  return '/news'
  if (url.startsWith('/content/')) return '/news/' + url.slice('/content/'.length)
  return url
}

// ─── Legacy migration (idempotent — runs once per legacy key) ─────────────────

function migrateLegacy() {
  for (const [legacyKey, newKey] of LEGACY_KEYS) {
    const raw = localStorage.getItem(legacyKey)
    if (!raw) continue
    try {
      const legacy = JSON.parse(raw) as MemoryItem[]
      if (!Array.isArray(legacy) || legacy.length === 0) {
        localStorage.removeItem(legacyKey)
        continue
      }
      const existing = safeRead(newKey)
      const existingSet = new Set(existing.map(x => `${x.type}:${x.id}`))
      // New-key items take precedence; legacy items fill in the rest
      const merged = [
        ...existing,
        ...legacy.filter(x => !existingSet.has(`${x.type}:${x.id}`)),
      ]
      localStorage.setItem(newKey, JSON.stringify(merged))
    } catch { /* ignore corrupt data */ }
    localStorage.removeItem(legacyKey)
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

let migrated = false

function safeRead(key: string): MemoryItem[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const items = JSON.parse(raw) as MemoryItem[]
    if (!Array.isArray(items)) return []
    return items.map(item => ({ ...item, url: normaliseUrl(item.url) }))
  } catch { return [] }
}

function readKey(key: string): MemoryItem[] {
  if (!migrated) { migrateLegacy(); migrated = true }
  return safeRead(key)
}

function writeKey(key: string, list: MemoryItem[]) {
  localStorage.setItem(key, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent(MEMORY_UPDATE_EVENT))
  // Also fire the legacy event name so any remaining old listeners still work
  window.dispatchEvent(new CustomEvent('hakkyo:archive:update'))
}

// ─── Public API — Recently Viewed ─────────────────────────────────────────────

/** Read the full recently-viewed list (newest first, all types). */
export function readRecent(): MemoryItem[] {
  return readKey(MEMORY_RECENT_KEY)
}

/**
 * Push an item to the front of Recently Viewed.
 * Deduplicates by id+type; keeps at most RECENT_MAX entries.
 */
export function pushRecent(item: MemoryItem): void {
  const list = readRecent().filter(x => !(x.id === item.id && x.type === item.type))
  writeKey(MEMORY_RECENT_KEY, [{ ...item, url: normaliseUrl(item.url) }, ...list].slice(0, RECENT_MAX))
}

// ─── Public API — Saved Items ─────────────────────────────────────────────────

/** Read the full saved list (all types). */
export function readSaved(): MemoryItem[] {
  return readKey(MEMORY_SAVED_KEY)
}

/** Returns true if the item is currently saved. */
export function isSaved(id: string, type: MemoryItemType): boolean {
  return readSaved().some(x => x.id === id && x.type === type)
}

/**
 * Toggle saved state.
 * Returns the new saved state (true = now saved).
 */
export function toggleSaved(item: MemoryItem): boolean {
  const list = readSaved()
  const idx  = list.findIndex(x => x.id === item.id && x.type === item.type)
  if (idx >= 0) {
    writeKey(MEMORY_SAVED_KEY, list.filter((_, i) => i !== idx))
    return false
  }
  writeKey(MEMORY_SAVED_KEY, [item, ...list].slice(0, SAVED_MAX))
  return true
}

/** Remove a saved item by id + type. */
export function unsaveItem(id: string, type: MemoryItemType): void {
  writeKey(MEMORY_SAVED_KEY, readSaved().filter(x => !(x.id === id && x.type === type)))
}

// ─── Convenience hook helpers ─────────────────────────────────────────────────

/**
 * Subscribe to memory updates (both hakkyo:memory:update and cross-tab storage events).
 * Returns an unsubscribe function.
 *
 * Usage inside useEffect:
 *   const unsub = subscribeToMemory(() => setItems(readRecent().slice(0, 5)))
 *   return unsub
 */
export function subscribeToMemory(callback: () => void): () => void {
  const onEvent = () => callback()
  const onStorage = (e: StorageEvent) => {
    if (e.key === MEMORY_RECENT_KEY || e.key === MEMORY_SAVED_KEY) callback()
  }
  window.addEventListener(MEMORY_UPDATE_EVENT, onEvent)
  window.addEventListener('hakkyo:archive:update', onEvent) // legacy compat
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(MEMORY_UPDATE_EVENT, onEvent)
    window.removeEventListener('hakkyo:archive:update', onEvent)
    window.removeEventListener('storage', onStorage)
  }
}
