/**
 * archive.ts — backward-compat re-export of memory.ts.
 *
 * All new code should import from '../lib/memory'.
 * This file exists only so that any remaining old imports keep compiling.
 */
export {
  // types
  type MemoryItemType  as ArchiveItemType,
  type MemoryItem      as ArchiveItem,
  // keys
  MEMORY_RECENT_KEY    as ARCHIVE_RECENT_KEY,
  MEMORY_SAVED_KEY     as ARCHIVE_SAVED_KEY,
  // recent
  readRecent,
  pushRecent,
  // saved
  readSaved,
  isSaved,
  toggleSaved,
  unsaveItem,
  // subscription helper
  subscribeToMemory,
} from './memory'
