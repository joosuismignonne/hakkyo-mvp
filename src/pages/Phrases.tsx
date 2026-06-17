/**
 * Phrases — emergency phrase tool for Korean workers in Québec.
 * Preset templates only. No AI. Browser SpeechSynthesis for audio.
 */
import { useState, useCallback } from 'react'
import { Copy, Volume2, Check } from 'lucide-react'
import { useLang } from '../context/LangContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Phrase {
  ko: string
  ko_formal: string
  en: string
  fr: string
}

interface Category {
  id: string
  icon: string
  ko: string
  en: string
  fr: string
  phrases: Phrase[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES: Category[] = [
  {
    id: 'resume',
    icon: '📄',
    ko: '이력서 내기',
    en: 'Dropping Resume',
    fr: 'Déposer son CV',
    phrases: [
      { ko: '이력서 드리러 왔어요.', ko_formal: '이력서를 제출하러 방문했습니다.', en: 'I came to drop off my resume.', fr: 'Je suis venu(e) déposer mon CV.' },
      { ko: '혹시 지금 직원 뽑나요?', ko_formal: '현재 채용 중이신지 여쭤봐도 될까요?', en: 'Are you currently hiring?', fr: 'Est-ce que vous embauchez en ce moment?' },
      { ko: '매니저랑 얘기할 수 있을까요?', ko_formal: '담당 매니저분과 대화할 수 있을까요?', en: 'Could I speak with the manager?', fr: 'Pourrais-je parler au gérant(e)?' },
      { ko: '제 연락처가 거기 있어요. 연락 기다릴게요.', ko_formal: '이력서에 연락처가 기재되어 있습니다. 연락 기다리겠습니다.', en: 'My contact is on there. I look forward to hearing from you.', fr: 'Mes coordonnées sont sur mon CV. J\'attends votre appel.' },
      { ko: '언제쯤 연락 주실 수 있을까요?', ko_formal: '언제쯤 연락을 주실 수 있는지 여쭤볼 수 있을까요?', en: 'When could I expect to hear back?', fr: 'Quand pourrais-je m\'attendre à avoir des nouvelles?' },
    ],
  },
  {
    id: 'customer',
    icon: '🛎️',
    ko: '손님 응대',
    en: 'Customer Service',
    fr: 'Service client',
    phrases: [
      { ko: '어서 오세요!', ko_formal: '어서 오세요!', en: 'Welcome! How can I help you?', fr: 'Bienvenue! Je peux vous aider?' },
      { ko: '잠깐 기다려 주세요.', ko_formal: '잠시만 기다려 주시겠습니까?', en: 'One moment please.', fr: 'Un instant s\'il vous plaît.' },
      { ko: '죄송해요, 다시 한번 말씀해 주실 수 있어요?', ko_formal: '죄송합니다, 다시 한번 말씀해 주시겠어요?', en: 'I\'m sorry, could you repeat that?', fr: 'Pardon, pourriez-vous répéter?' },
      { ko: '영어로 말씀해 주실 수 있어요?', ko_formal: '영어로 말씀해 주실 수 있으실까요?', en: 'Could you speak in English?', fr: 'Pouvez-vous parler en anglais?' },
      { ko: '좋은 하루 되세요!', ko_formal: '즐거운 하루 보내세요!', en: 'Have a great day!', fr: 'Bonne journée!' },
      { ko: '계산은 여기서 해드릴게요.', ko_formal: '결제는 이쪽에서 도와드리겠습니다.', en: 'I\'ll take care of the payment here.', fr: 'Je vais m\'occuper du paiement ici.' },
    ],
  },
  {
    id: 'order',
    icon: '☕',
    ko: '주문하기',
    en: 'Taking Orders',
    fr: 'Prendre les commandes',
    phrases: [
      { ko: '뭘 드실 건가요?', ko_formal: '무엇을 주문하시겠습니까?', en: 'What would you like to have?', fr: 'Qu\'est-ce que vous désirez?' },
      { ko: '따뜻한 거요, 차가운 거요?', ko_formal: '따뜻하게 드릴까요, 차갑게 드릴까요?', en: 'Hot or cold?', fr: 'Chaud ou froid?' },
      { ko: '여기서 드실 건가요, 가져가실 건가요?', ko_formal: '여기서 드실 건가요, 포장하실 건가요?', en: 'For here or to go?', fr: 'Sur place ou pour emporter?' },
      { ko: '이름이 어떻게 되세요?', ko_formal: '성함이 어떻게 되십니까?', en: 'Can I get your name?', fr: 'C\'est à quel nom?' },
      { ko: '총 X달러입니다.', ko_formal: '총 금액은 X달러입니다.', en: 'That will be X dollars.', fr: 'Ça fait X dollars.' },
      { ko: '잠깐만요, 바로 가져다 드릴게요.', ko_formal: '잠시만 기다려 주세요, 바로 가져다 드리겠습니다.', en: 'Just a moment, I\'ll bring that right over.', fr: 'Un instant, je vous apporte ça de suite.' },
    ],
  },
  {
    id: 'directions',
    icon: '🗺️',
    ko: '길 묻기',
    en: 'Asking Directions',
    fr: 'Demander son chemin',
    phrases: [
      { ko: '지하철역이 어디에요?', ko_formal: '지하철역이 어디에 있나요?', en: 'Where is the metro station?', fr: 'Où est la station de métro?' },
      { ko: '여기가 맞나요?', ko_formal: '이 주소가 맞는지 확인해도 될까요?', en: 'Is this the right place?', fr: 'C\'est bien ici?' },
      { ko: '버스 몇 번 타야 해요?', ko_formal: '몇 번 버스를 타야 하나요?', en: 'Which bus should I take?', fr: 'Quel bus je dois prendre?' },
      { ko: '여기서 걸어서 얼마나 걸려요?', ko_formal: '도보로 얼마나 걸리나요?', en: 'How long does it take to walk from here?', fr: 'C\'est à combien de marche d\'ici?' },
      { ko: '길을 잃었어요. 도와주실 수 있어요?', ko_formal: '길을 잃었습니다. 도움을 주실 수 있으신가요?', en: 'I\'m lost. Can you help me?', fr: 'Je suis perdu(e). Pouvez-vous m\'aider?' },
    ],
  },
  {
    id: 'phone',
    icon: '📞',
    ko: '전화하기',
    en: 'On the Phone',
    fr: 'Au téléphone',
    phrases: [
      { ko: '안녕하세요, ○○이라고 하는데요.', ko_formal: '안녕하세요, 저는 ○○입니다.', en: 'Hello, this is ○○ speaking.', fr: 'Bonjour, c\'est ○○ à l\'appareil.' },
      { ko: '혹시 ○○ 씨 계세요?', ko_formal: '○○ 씨와 통화할 수 있을까요?', en: 'Could I speak with ○○?', fr: 'Est-ce que je pourrais parler à ○○?' },
      { ko: '다시 한번 말씀해 주실 수 있어요?', ko_formal: '죄송합니다, 다시 말씀해 주시겠어요?', en: 'Could you repeat that please?', fr: 'Pourriez-vous répéter s\'il vous plaît?' },
      { ko: '천천히 말씀해 주실 수 있어요?', ko_formal: '좀 더 천천히 말씀해 주시겠어요?', en: 'Could you speak more slowly?', fr: 'Pouvez-vous parler plus lentement?' },
      { ko: '메시지 남겨 드릴까요?', ko_formal: '메시지를 남겨 드릴까요?', en: 'Can I leave a message?', fr: 'Je peux laisser un message?' },
      { ko: '나중에 다시 전화할게요.', ko_formal: '나중에 다시 연락드리겠습니다.', en: 'I\'ll call back later.', fr: 'Je rappellerai plus tard.' },
    ],
  },
  {
    id: 'medical',
    icon: '🏥',
    ko: '병원/약국',
    en: 'Medical / Pharmacy',
    fr: 'Médecin / Pharmacie',
    phrases: [
      { ko: '머리가 아파요.', ko_formal: '두통이 있습니다.', en: 'I have a headache.', fr: 'J\'ai mal à la tête.' },
      { ko: '배가 아파요.', ko_formal: '복통이 있습니다.', en: 'I have a stomachache.', fr: 'J\'ai mal au ventre.' },
      { ko: '열이 나요.', ko_formal: '발열 증상이 있습니다.', en: 'I have a fever.', fr: 'J\'ai de la fièvre.' },
      { ko: '이 약 어떻게 먹어요?', ko_formal: '이 약은 어떻게 복용하나요?', en: 'How should I take this medicine?', fr: 'Comment je dois prendre ce médicament?' },
      { ko: '약국이 어디에 있어요?', ko_formal: '가장 가까운 약국이 어디에 있나요?', en: 'Where is the nearest pharmacy?', fr: 'Où est la pharmacie la plus proche?' },
      { ko: '알레르기가 있어요.', ko_formal: '알레르기 반응이 있습니다.', en: 'I have an allergy.', fr: 'J\'ai une allergie.' },
      { ko: '응급실 어디예요?', ko_formal: '응급실이 어디에 있나요?', en: 'Where is the emergency room?', fr: 'Où sont les urgences?' },
    ],
  },
  {
    id: 'housing',
    icon: '🏠',
    ko: '집 구하기',
    en: 'Finding Housing',
    fr: 'Chercher un logement',
    phrases: [
      { ko: '방 있어요?', ko_formal: '혹시 방을 구하고 있습니다. 방이 있나요?', en: 'Do you have a room available?', fr: 'Avez-vous une chambre disponible?' },
      { ko: '월세가 얼마예요?', ko_formal: '월 임대료가 얼마인가요?', en: 'How much is the monthly rent?', fr: 'Quel est le loyer mensuel?' },
      { ko: '유틸리티 포함이에요?', ko_formal: '공과금이 포함되어 있나요?', en: 'Are utilities included?', fr: 'Les services publics sont-ils inclus?' },
      { ko: '언제부터 들어갈 수 있어요?', ko_formal: '언제부터 입주 가능한가요?', en: 'When would it be available?', fr: 'À partir de quand c\'est disponible?' },
      { ko: '보증금이 얼마예요?', ko_formal: '보증금은 얼마인가요?', en: 'How much is the deposit?', fr: 'Quel est le dépôt de garantie?' },
      { ko: '계약서 보여주실 수 있어요?', ko_formal: '계약서를 볼 수 있을까요?', en: 'Can I see the lease?', fr: 'Je peux voir le bail?' },
      { ko: '가구 있어요?', ko_formal: '가구가 포함된 방인가요?', en: 'Is it furnished?', fr: 'C\'est meublé?' },
    ],
  },
]

// ─── TTS ──────────────────────────────────────────────────────────────────────

function speak(text: string, lang: 'fr' | 'en') {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = lang === 'fr' ? 'fr-CA' : 'en-CA'
  utt.rate = 0.85
  window.speechSynthesis.speak(utt)
}

async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true }
  catch { return false }
}

// ─── Phrase Card ──────────────────────────────────────────────────────────────

function PhraseCard({ phrase, showFormal }: { phrase: Phrase; showFormal: boolean }) {
  const [copiedLang, setCopiedLang] = useState<string | null>(null)

  const handleCopy = useCallback(async (text: string, lang: string) => {
    const ok = await copyText(text)
    if (ok) {
      setCopiedLang(lang)
      setTimeout(() => setCopiedLang(null), 1800)
    }
  }, [])

  const koText = showFormal ? phrase.ko_formal : phrase.ko

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
      {/* Korean */}
      <div className="mb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">한국어</span>
            <p className="text-[15px] font-semibold text-gray-900 mt-0.5 leading-snug">{koText}</p>
          </div>
          <div className="flex gap-1 shrink-0 mt-1">
            <button
              onClick={() => handleCopy(koText, 'ko')}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              title="Copy"
            >
              {copiedLang === 'ko' ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* EN + FR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* English */}
        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">🇨🇦 EN</span>
              <p className="text-[13px] text-gray-700 mt-0.5 leading-snug">{phrase.en}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => speak(phrase.en, 'en')}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                title="Listen"
              >
                <Volume2 size={12} />
              </button>
              <button
                onClick={() => handleCopy(phrase.en, 'en')}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Copy"
              >
                {copiedLang === 'en' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>

        {/* French */}
        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">🇫🇷 FR</span>
              <p className="text-[13px] text-gray-700 mt-0.5 leading-snug">{phrase.fr}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => speak(phrase.fr, 'fr')}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Listen"
              >
                <Volume2 size={12} />
              </button>
              <button
                onClick={() => handleCopy(phrase.fr, 'fr')}
                className="w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                title="Copy"
              >
                {copiedLang === 'fr' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Phrases() {
  const { lang, t } = useLang()
  const [activeId, setActiveId] = useState(CATEGORIES[0].id)
  const [showFormal, setShowFormal] = useState(false)
  const [search, setSearch] = useState('')

  const active = CATEGORIES.find(c => c.id === activeId) ?? CATEGORIES[0]

  const filtered = search.trim()
    ? CATEGORIES.flatMap(cat =>
        cat.phrases
          .filter(p => {
            const q = search.toLowerCase()
            return (
              p.ko.includes(search) ||
              p.ko_formal.includes(search) ||
              p.en.toLowerCase().includes(q) ||
              p.fr.toLowerCase().includes(q)
            )
          })
          .map(p => ({ ...p, _catIcon: cat.icon, _catName: lang === 'ko' ? cat.ko : lang === 'fr' ? cat.fr : cat.en }))
      )
    : active.phrases.map(p => ({ ...p, _catIcon: '', _catName: '' }))

  const catLabel = (c: Category) => lang === 'ko' ? c.ko : lang === 'fr' ? c.fr : c.en

  const tts = window.speechSynthesis !== undefined

  return (
    <div className="w-full min-h-screen bg-gray-50 pb-20">
      <div className="max-w-[720px] mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-[22px] font-bold text-gray-900">
            {t('퀵 표현 도우미', 'Quick Phrase Helper', 'Aide aux phrases')}
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {t('필요한 상황의 한·영·불 표현을 빠르게 확인하세요.', 'Quickly find Korean, English, and French phrases for any situation.', 'Retrouvez rapidement des phrases en coréen, anglais et français.')}
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <input
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[14px] placeholder:text-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
            placeholder={t('검색: 이력서, sorry, excuse moi...', 'Search: resume, sorry, excuse moi...', 'Chercher: CV, sorry, excuse moi...')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-[18px]"
            >×</button>
          )}
        </div>

        {/* Formal toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {!search && CATEGORIES.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full border whitespace-nowrap transition-all shrink-0"
                style={activeId === c.id && !search
                  ? { background: '#111', borderColor: '#111', color: '#fff' }
                  : { background: '#fff', borderColor: '#E5E7EB', color: '#374151' }
                }
              >
                <span>{c.icon}</span>
                {catLabel(c)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFormal(v => !v)}
            className="ml-3 text-[11px] font-semibold border rounded-full px-3 py-1.5 whitespace-nowrap transition-all shrink-0"
            style={showFormal
              ? { background: 'var(--y)', borderColor: 'var(--y)', color: '#111' }
              : { background: '#fff', borderColor: '#E5E7EB', color: '#6B7280' }
            }
          >
            {t('격식체', 'Formal', 'Formel')}
          </button>
        </div>

        {/* TTS unavailable note */}
        {!tts && (
          <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
            {t('이 기기에서는 음성 재생이 지원되지 않습니다.', 'Speech is not supported on this device.', 'La synthèse vocale n\'est pas disponible sur cet appareil.')}
          </p>
        )}

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-[15px] font-medium text-gray-700">
              {t('검색 결과가 없어요.', 'No results found.', 'Aucun résultat.')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p, i) => (
              <div key={i}>
                {search && p._catName && (
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                    {p._catIcon} {p._catName}
                  </p>
                )}
                <PhraseCard phrase={p} showFormal={showFormal} />
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400 mt-10">
          {t('표현은 퀘벡 일상 상황을 기준으로 합니다.', 'Phrases are based on everyday Québec situations.', 'Les phrases sont basées sur des situations quotidiennes au Québec.')}
        </p>
      </div>
    </div>
  )
}
