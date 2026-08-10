// Shared types for Journey pages (Arriving, Settling, and future pages)

export type Tri = { ko: string; en: string; fr: string }

export function tri(obj: Tri, lang: string): string {
  return lang === 'ko' ? obj.ko : lang === 'fr' ? obj.fr : obj.en
}

export interface HeroData {
  title: Tri
  sub: Tri
  when: Tri
  cost: Tri
  time: Tri
  canBeforeArrival: Tri
}

export interface OptionData {
  name: string
  sub: Tri
  topPick?: boolean
  meta: Array<{ icon: string; label: Tri }>
  worksFor: Tri[]
  worthKnowing: Tri[]
  recommendNote?: Tri
}

export interface CompareRow {
  name: string
  cols: Array<string | boolean>
}

export interface CompareTable {
  headers: Tri[]
  rows: CompareRow[]
}

export interface CommunityNote {
  flag: string
  person: Tri
  text: Tri
  likes: number
}

export interface HelpLink {
  label: Tri
  url: string
  domain: string
}

export interface FAQItem {
  q: Tri
  a: Tri
}

export interface SidebarData {
  quickFacts: Array<{ label: Tri; value: Tri }>
  timeline: Tri
  nextStepId?: string
  nextStepLabel?: Tri
}

export interface CompletionCard {
  headline: Tri
  body: Tri
}

export interface JourneyStep {
  id: string
  label: Tri
  hero: HeroData
  options: OptionData[]
  compareTable: CompareTable
  communityNotes: CommunityNote[]
  helpLinks: HelpLink[]
  faq: FAQItem[]
  sidebar: SidebarData
  completionCard: CompletionCard
}
