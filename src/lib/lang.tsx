import { createContext, useContext, useState } from 'react'

export type Lang = 'ko' | 'en' | 'fr'

// ── Full UI translation table ──────────────────────────────────────────────
export const UI = {
  ko: {
    nav: { home: '홈', programs: '프로그램', mini: 'Mini HAKKYO' },
    section: { main: '메인', community: '커뮤니티' },
    search: {
      label: '검색', kbd: '⌘K',
      placeholder: '검색 — 프로그램, 채널, 클럽…',
      hint: '자주 찾는 페이지 · ↵ 로 이동',
      empty: (q: string) => `"${q}"에 대한 결과가 없어요`,
    },
    footer: { apply: '✋ 커뮤니티 신청', subscribe: '🔔 소식 받기' },
    home: {
      title: '홈', desc: 'Montréal Learning Community · 2026',
      compose: 'HAKKYO 커뮤니티에 참여하고 싶으신가요?', applyBtn: '커뮤니티 신청',
      pinned: '공지', like: '좋아요', readMore: '더 보기', collapse: '접기', subscribeBtn: '소식 받기',
      miniSection: 'MINI HAKKYO · 다음 일정',
      programSection: '언어 프로그램 · SESSION 04',
      reviewSection: '수강생 이야기',
      noticeSection: '최신 소식',
      today: '오늘', tomorrow: '내일',
    },
    board: { title: '공지', desc: '공식 소식과 공지사항' },
    programs: { title: '프로그램', desc: 'SESSION 04 언어 프로그램', applyBtn: '신청하기', sessionLabel: 'SESSION 04' },
    activities: { title: 'Mini HAKKYO', desc: '매주 수요일 클럽 활동', applyBtn: '✋ 신청하기' },
    channels: {
      '공지': '공지',
      '자유게시판': '자유게시판',
      '언어교환': '언어교환',
      '주거': '주거',
      '취업·이민': '취업·이민',
      '이벤트·모임': '이벤트·모임',
      '리뷰': '리뷰',
    },
    reviews: {
      title: '리뷰', desc: '수강생 솔직 후기', tag: 'REVIEW',
      compose: '후기를 작성하고 싶으신가요?', joinBtn: '커뮤니티 가입 후 이용',
      comingSoonTitle: '리뷰 채널이 곧 열려요',
      comingSoonBody: 'HAKKYO 수강생이라면 누구나 솔직한 후기를 올릴 수 있어요. 커뮤니티에 신청하면 채널이 열릴 때 가장 먼저 알려드려요.',
      joinCta: '✋ 커뮤니티 신청하기', subscribeCta: '🔔 소식 받기',
    },
    searchItems: {
      home: ['홈', 'HAKKYO 메인'],
      board: ['공지', 'HAKKYO 공식 소식'],
      programs: ['프로그램', 'SESSION 04 언어 프로그램'],
      mini: ['Mini HAKKYO', '매주 수요일 클럽'],
      applyNews: ['소식 신청', '4기 소식 먼저 받기'],
      applyCommunity: ['커뮤니티 신청', 'HAKKYO 커뮤니티 합류'],
      channelSub: '커뮤니티 채널',
    },
  },
  en: {
    nav: { home: 'Home', programs: 'Programs', mini: 'Mini HAKKYO' },
    section: { main: 'MAIN', community: 'COMMUNITY' },
    search: {
      label: 'Search', kbd: '⌘K',
      placeholder: 'Search — programs, channels, clubs…',
      hint: 'Quick access · Press ↵ to open',
      empty: (q: string) => `No results for "${q}"`,
    },
    footer: { apply: '✋ Join Community', subscribe: '🔔 Subscribe' },
    home: {
      title: 'Home', desc: 'Montréal Learning Community · 2026',
      compose: 'Want to join the HAKKYO community?', applyBtn: 'Join',
      pinned: 'Pinned', like: 'Like', readMore: 'Read more', collapse: 'Collapse', subscribeBtn: 'Subscribe',
      miniSection: 'MINI HAKKYO · UPCOMING',
      programSection: 'LANGUAGE PROGRAMS · SESSION 04',
      reviewSection: 'Student Stories',
      noticeSection: 'Latest News',
      today: 'Today', tomorrow: 'Tomorrow',
    },
    board: { title: 'Announcements', desc: 'Official news & announcements' },
    programs: { title: 'Programs', desc: 'SESSION 04 Language Programs', applyBtn: 'Apply', sessionLabel: 'SESSION 04' },
    activities: { title: 'Mini HAKKYO', desc: 'Weekly Wednesday clubs', applyBtn: '✋ Apply' },
    channels: {
      '공지': 'Announcements',
      '자유게시판': 'General',
      '언어교환': 'Language Exchange',
      '주거': 'Housing',
      '취업·이민': 'Jobs & Immigration',
      '이벤트·모임': 'Events',
      '리뷰': 'Reviews',
    },
    reviews: {
      title: 'Reviews', desc: 'Honest student reviews', tag: 'REVIEW',
      compose: 'Want to share your experience?', joinBtn: 'Join to post',
      comingSoonTitle: 'Reviews channel coming soon',
      comingSoonBody: 'Any HAKKYO student can share an honest review. Apply to the community and we\'ll notify you when this channel opens.',
      joinCta: '✋ Join Community', subscribeCta: '🔔 Subscribe',
    },
    searchItems: {
      home: ['Home', 'HAKKYO Main'],
      board: ['Announcements', 'Official HAKKYO news'],
      programs: ['Programs', 'SESSION 04 Language Programs'],
      mini: ['Mini HAKKYO', 'Weekly Wednesday clubs'],
      applyNews: ['Subscribe', 'Get notified for Session 4'],
      applyCommunity: ['Join Community', 'Join HAKKYO community'],
      channelSub: 'Community channel',
    },
  },
  fr: {
    nav: { home: 'Accueil', programs: 'Programmes', mini: 'Mini HAKKYO' },
    section: { main: 'PRINCIPAL', community: 'COMMUNAUTÉ' },
    search: {
      label: 'Rechercher', kbd: '⌘K',
      placeholder: 'Chercher — programmes, canaux, clubs…',
      hint: 'Accès rapide · ↵ pour ouvrir',
      empty: (q: string) => `Aucun résultat pour "${q}"`,
    },
    footer: { apply: '✋ Rejoindre', subscribe: '🔔 S\'abonner' },
    home: {
      title: 'Accueil', desc: 'Montréal Learning Community · 2026',
      compose: 'Envie de rejoindre la communauté HAKKYO ?', applyBtn: 'Rejoindre',
      pinned: 'Épinglé', like: 'J\'aime', readMore: 'Voir plus', collapse: 'Réduire', subscribeBtn: 'S\'abonner',
      miniSection: 'MINI HAKKYO · PROCHAINS',
      programSection: 'PROGRAMMES DE LANGUES · SESSION 04',
      reviewSection: 'Témoignages',
      noticeSection: 'Dernières nouvelles',
      today: 'Aujourd\'hui', tomorrow: 'Demain',
    },
    board: { title: 'Annonces', desc: 'Nouvelles et annonces officielles' },
    programs: { title: 'Programmes', desc: 'Programmes de langues SESSION 04', applyBtn: 'S\'inscrire', sessionLabel: 'SESSION 04' },
    activities: { title: 'Mini HAKKYO', desc: 'Clubs du mercredi', applyBtn: '✋ S\'inscrire' },
    channels: {
      '공지': 'Annonces',
      '자유게시판': 'Général',
      '언어교환': 'Échange de langues',
      '주거': 'Logement',
      '취업·이민': 'Emploi & Immigration',
      '이벤트·모임': 'Événements',
      '리뷰': 'Avis',
    },
    reviews: {
      title: 'Avis', desc: 'Avis honnêtes des étudiants', tag: 'AVIS',
      compose: 'Envie de partager votre expérience ?', joinBtn: 'Rejoindre pour écrire',
      comingSoonTitle: 'Canal d\'avis bientôt disponible',
      comingSoonBody: 'Tout étudiant HAKKYO peut partager un avis honnête. Rejoignez la communauté pour être notifié à l\'ouverture.',
      joinCta: '✋ Rejoindre', subscribeCta: '🔔 S\'abonner',
    },
    searchItems: {
      home: ['Accueil', 'Principal HAKKYO'],
      board: ['Annonces', 'Nouvelles officielles HAKKYO'],
      programs: ['Programmes', 'Programmes SESSION 04'],
      mini: ['Mini HAKKYO', 'Clubs du mercredi'],
      applyNews: ['S\'abonner', 'Notification Session 4'],
      applyCommunity: ['Rejoindre', 'Rejoindre la communauté HAKKYO'],
      channelSub: 'Canal communautaire',
    },
  },
} as const

// ── Context ────────────────────────────────────────────────────────────────
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: 'ko', setLang: () => {},
})

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    (localStorage.getItem('hakkyo_lang') as Lang) || 'ko'
  )
  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('hakkyo_lang', l)
  }
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}

export function useT() {
  const { lang } = useLang()
  return UI[lang]
}

export function pick<T extends { ko?: string; en?: string; fr?: string }>(obj: T, lang: Lang): string {
  return (obj[lang] as string) || (obj.ko as string) || (obj.en as string) || (obj.fr as string) || ''
}
