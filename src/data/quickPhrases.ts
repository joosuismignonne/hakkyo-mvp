export interface PhraseVariants {
  natural: string
  polite: string
  simple: string
}

export interface Situation {
  id: string
  ko: string
  en: PhraseVariants
  fr: PhraseVariants
}

export interface PhraseCategory {
  id: string
  icon: string
  ko: string
  en: string
  fr: string
  situations: Situation[]
}

export const QUICK_PHRASES: PhraseCategory[] = [
  // ─── 1. 이력서 내기 ────────────────────────────────────────────────────────
  {
    id: 'resume',
    icon: '📄',
    ko: '이력서 내기',
    en: 'Dropping Resume',
    fr: 'Déposer son CV',
    situations: [
      {
        id: 'resume_drop',
        ko: '이력서 드리러 왔어요',
        en: {
          natural: "Hi, I came to drop off my resume.",
          polite:  "Good morning, I'd like to submit my resume.",
          simple:  "I have my resume for you.",
        },
        fr: {
          natural: "Bonjour, je suis venu(e) déposer mon CV.",
          polite:  "Bonjour, je souhaiterais remettre mon curriculum vitae.",
          simple:  "J'ai mon CV pour vous.",
        },
      },
      {
        id: 'resume_hiring',
        ko: '지금 직원 뽑나요?',
        en: {
          natural: "Are you guys hiring right now?",
          polite:  "Are you currently looking for new staff?",
          simple:  "Are you hiring?",
        },
        fr: {
          natural: "Vous cherchez du monde en ce moment?",
          polite:  "Est-ce que vous embauchez en ce moment?",
          simple:  "Vous embauchez?",
        },
      },
      {
        id: 'resume_manager',
        ko: '매니저와 얘기할 수 있나요?',
        en: {
          natural: "Is the manager around? I'd love to introduce myself.",
          polite:  "Could I speak with the manager, please?",
          simple:  "Can I talk to the manager?",
        },
        fr: {
          natural: "Le gérant(e) est là? J'aimerais me présenter.",
          polite:  "Serait-il possible de parler au gérant(e)?",
          simple:  "Le gérant est là?",
        },
      },
      {
        id: 'resume_callback',
        ko: '언제 다시 연락드리면 될까요?',
        en: {
          natural: "When's a good time for me to follow up?",
          polite:  "When would be an appropriate time to check back in?",
          simple:  "When should I call back?",
        },
        fr: {
          natural: "C'est quand un bon moment pour que je rappelle?",
          polite:  "Quand serait-il approprié de faire un suivi?",
          simple:  "Je rappelle quand?",
        },
      },
      {
        id: 'resume_contact',
        ko: '제 연락처를 남겨도 될까요?',
        en: {
          natural: "Can I leave my number with you?",
          polite:  "May I leave my contact information?",
          simple:  "My number is on the resume.",
        },
        fr: {
          natural: "Je peux vous laisser mon numéro?",
          polite:  "Puis-je laisser mes coordonnées?",
          simple:  "Mon numéro est sur le CV.",
        },
      },
      {
        id: 'resume_experience',
        ko: '저 이쪽 경험 있어요',
        en: {
          natural: "I've actually worked in this kind of place before.",
          polite:  "I have relevant experience in this field.",
          simple:  "I have experience.",
        },
        fr: {
          natural: "J'ai déjà travaillé dans ce genre d'endroit.",
          polite:  "J'ai de l'expérience pertinente dans ce domaine.",
          simple:  "J'ai de l'expérience.",
        },
      },
      {
        id: 'resume_available',
        ko: '언제부터 일할 수 있어요',
        en: {
          natural: "I'm available to start right away.",
          polite:  "I'm available to begin at your earliest convenience.",
          simple:  "I can start anytime.",
        },
        fr: {
          natural: "Je suis dispo pour commencer tout de suite.",
          polite:  "Je suis disponible dès que vous le souhaitez.",
          simple:  "Je peux commencer n'importe quand.",
        },
      },
      {
        id: 'resume_thanks',
        ko: '시간 내주셔서 감사해요',
        en: {
          natural: "Thanks so much for your time, I really appreciate it.",
          polite:  "Thank you very much for taking the time to see me.",
          simple:  "Thank you.",
        },
        fr: {
          natural: "Merci beaucoup pour votre temps, j'apprécie vraiment.",
          polite:  "Je vous remercie de m'avoir accordé de votre temps.",
          simple:  "Merci.",
        },
      },
    ],
  },

  // ─── 2. 손님 응대 ────────────────────────────────────────────────────────────
  {
    id: 'customer',
    icon: '🛎️',
    ko: '손님 응대',
    en: 'Customer Service',
    fr: 'Service client',
    situations: [
      {
        id: 'customer_welcome',
        ko: '어서 오세요, 도와드릴까요?',
        en: {
          natural: "Hey, welcome in! What can I get you?",
          polite:  "Welcome! How may I assist you today?",
          simple:  "Hi! Can I help?",
        },
        fr: {
          natural: "Bonjour, bienvenue! Qu'est-ce que je peux faire pour vous?",
          polite:  "Bienvenue. Comment puis-je vous aider aujourd'hui?",
          simple:  "Bonjour! Je peux aider?",
        },
      },
      {
        id: 'customer_wait',
        ko: '잠깐만 기다려 주세요',
        en: {
          natural: "Just one sec, I'll be right with you.",
          polite:  "One moment please, I'll be right with you.",
          simple:  "One moment please.",
        },
        fr: {
          natural: "Une seconde, j'arrive tout de suite.",
          polite:  "Un instant s'il vous plaît, je reviens.",
          simple:  "Un moment s'il vous plaît.",
        },
      },
      {
        id: 'customer_repeat',
        ko: '다시 한번 말씀해 주실 수 있어요?',
        en: {
          natural: "Sorry, could you say that again?",
          polite:  "I'm sorry, could you please repeat that?",
          simple:  "Again please?",
        },
        fr: {
          natural: "Désolé(e), vous pouvez répéter?",
          polite:  "Je suis désolé(e), pourriez-vous répéter?",
          simple:  "Encore une fois?",
        },
      },
      {
        id: 'customer_english',
        ko: '영어로 말씀해 주실 수 있어요?',
        en: {
          natural: "My French isn't great — do you speak English?",
          polite:  "Would you mind if we spoke in English?",
          simple:  "English please?",
        },
        fr: {
          natural: "Mon français est limité — vous parlez anglais?",
          polite:  "Seriez-vous à l'aise de parler en anglais?",
          simple:  "En anglais s'il vous plaît?",
        },
      },
      {
        id: 'customer_sorry',
        ko: '죄송해요, 제가 잘 못 알아들었어요',
        en: {
          natural: "Sorry, I didn't quite catch that.",
          polite:  "I apologize, I didn't understand.",
          simple:  "Sorry, I don't understand.",
        },
        fr: {
          natural: "Désolé(e), j'ai pas bien compris.",
          polite:  "Je m'excuse, je n'ai pas bien compris.",
          simple:  "Désolé(e), je comprends pas.",
        },
      },
      {
        id: 'customer_goodbye',
        ko: '좋은 하루 되세요!',
        en: {
          natural: "Have a great one! See you next time.",
          polite:  "Thank you and have a wonderful day.",
          simple:  "Have a good day!",
        },
        fr: {
          natural: "Bonne journée! À la prochaine.",
          polite:  "Merci et passez une excellente journée.",
          simple:  "Bonne journée!",
        },
      },
      {
        id: 'customer_payment',
        ko: '결제는 이쪽에서 도와드릴게요',
        en: {
          natural: "I can take your payment right here.",
          polite:  "I'll process your payment here.",
          simple:  "Pay here please.",
        },
        fr: {
          natural: "Je peux m'occuper du paiement ici.",
          polite:  "Je vais traiter votre paiement ici.",
          simple:  "Payez ici s'il vous plaît.",
        },
      },
      {
        id: 'customer_notavailable',
        ko: '죄송해요, 지금 그건 없어요',
        en: {
          natural: "Sorry, we're actually out of that right now.",
          polite:  "I apologize, that item is not available at the moment.",
          simple:  "Sorry, we don't have that.",
        },
        fr: {
          natural: "Désolé(e), on n'a plus ça pour l'instant.",
          polite:  "Je suis désolé(e), cet article n'est pas disponible pour le moment.",
          simple:  "Désolé(e), on a pas ça.",
        },
      },
    ],
  },

  // ─── 3. 주문하기 ─────────────────────────────────────────────────────────────
  {
    id: 'order',
    icon: '☕',
    ko: '주문하기',
    en: 'Taking Orders',
    fr: 'Prendre les commandes',
    situations: [
      {
        id: 'order_what',
        ko: '뭘 드릴까요?',
        en: {
          natural: "What can I get started for you?",
          polite:  "What would you like to order?",
          simple:  "What would you like?",
        },
        fr: {
          natural: "Qu'est-ce que je vous prépare?",
          polite:  "Qu'est-ce que vous désirez?",
          simple:  "Vous désirez?",
        },
      },
      {
        id: 'order_hotcold',
        ko: '따뜻한 거요, 차가운 거요?',
        en: {
          natural: "You want that hot or iced?",
          polite:  "Would you prefer that hot or cold?",
          simple:  "Hot or cold?",
        },
        fr: {
          natural: "Vous le voulez chaud ou glacé?",
          polite:  "Préférez-vous cela chaud ou froid?",
          simple:  "Chaud ou froid?",
        },
      },
      {
        id: 'order_here_togo',
        ko: '여기서 드실 건가요, 가져가실 건가요?',
        en: {
          natural: "Is that for here or to go?",
          polite:  "Will you be having that here or would you like it to go?",
          simple:  "Here or to go?",
        },
        fr: {
          natural: "C'est pour manger ici ou pour emporter?",
          polite:  "Mangerez-vous ici ou c'est pour emporter?",
          simple:  "Sur place ou pour emporter?",
        },
      },
      {
        id: 'order_name',
        ko: '이름이 어떻게 되세요?',
        en: {
          natural: "Can I get a name for the order?",
          polite:  "May I have your name please?",
          simple:  "Your name?",
        },
        fr: {
          natural: "C'est à quel nom?",
          polite:  "Puis-je avoir votre nom?",
          simple:  "Votre nom?",
        },
      },
      {
        id: 'order_total',
        ko: '총 X달러입니다',
        en: {
          natural: "That comes to X dollars.",
          polite:  "Your total is X dollars please.",
          simple:  "X dollars please.",
        },
        fr: {
          natural: "Ça fait X dollars.",
          polite:  "Votre total est de X dollars s'il vous plaît.",
          simple:  "X dollars s'il vous plaît.",
        },
      },
      {
        id: 'order_ready',
        ko: '주문하신 거 나왔어요',
        en: {
          natural: "Hey, your order's ready!",
          polite:  "Your order is ready.",
          simple:  "It's ready!",
        },
        fr: {
          natural: "Votre commande est prête!",
          polite:  "Votre commande est prête, monsieur/madame.",
          simple:  "C'est prêt!",
        },
      },
      {
        id: 'order_anything_else',
        ko: '다른 거 더 필요하신 거 있어요?',
        en: {
          natural: "Is there anything else I can get you?",
          polite:  "Is there anything else you'd like?",
          simple:  "Anything else?",
        },
        fr: {
          natural: "Je peux vous apporter autre chose?",
          polite:  "Désirez-vous autre chose?",
          simple:  "Autre chose?",
        },
      },
      {
        id: 'order_cash_card',
        ko: '현금이에요, 카드예요?',
        en: {
          natural: "Cash or card?",
          polite:  "Will you be paying by cash or card?",
          simple:  "Cash or card?",
        },
        fr: {
          natural: "Comptant ou carte?",
          polite:  "Payez-vous par comptant ou par carte?",
          simple:  "Comptant ou carte?",
        },
      },
    ],
  },

  // ─── 4. 길 묻기 ─────────────────────────────────────────────────────────────
  {
    id: 'directions',
    icon: '🗺️',
    ko: '길 묻기',
    en: 'Asking Directions',
    fr: 'Demander son chemin',
    situations: [
      {
        id: 'dir_metro',
        ko: '지하철역이 어디에 있어요?',
        en: {
          natural: "Hey, where's the closest metro station?",
          polite:  "Could you tell me where the nearest metro station is?",
          simple:  "Where is the metro?",
        },
        fr: {
          natural: "La station de métro, c'est par où?",
          polite:  "Pourriez-vous m'indiquer la station de métro la plus proche?",
          simple:  "Où est le métro?",
        },
      },
      {
        id: 'dir_lost',
        ko: '길을 잃었어요',
        en: {
          natural: "I'm totally lost — can you help me out?",
          polite:  "I'm afraid I'm lost. Could you help me please?",
          simple:  "I'm lost. Help?",
        },
        fr: {
          natural: "Je suis complètement perdu(e) — vous pouvez m'aider?",
          polite:  "Je crois que je me suis perdu(e). Pourriez-vous m'aider?",
          simple:  "Je suis perdu(e).",
        },
      },
      {
        id: 'dir_address',
        ko: '이 주소가 어디예요?',
        en: {
          natural: "Do you know where this address is?",
          polite:  "Could you help me find this address?",
          simple:  "Where is this?",
        },
        fr: {
          natural: "Vous savez où est cette adresse?",
          polite:  "Pourriez-vous m'aider à trouver cette adresse?",
          simple:  "C'est où?",
        },
      },
      {
        id: 'dir_walk',
        ko: '걸어서 얼마나 걸려요?',
        en: {
          natural: "How far is it on foot from here?",
          polite:  "How long would it take to walk there?",
          simple:  "How far to walk?",
        },
        fr: {
          natural: "C'est loin à pied d'ici?",
          polite:  "Combien de temps faut-il pour y aller à pied?",
          simple:  "C'est loin?",
        },
      },
      {
        id: 'dir_bus',
        ko: '몇 번 버스 타야 해요?',
        en: {
          natural: "Which bus do I need to take?",
          polite:  "Could you tell me which bus route I should take?",
          simple:  "Which bus?",
        },
        fr: {
          natural: "C'est quel bus que je dois prendre?",
          polite:  "Pourriez-vous me dire quelle ligne de bus prendre?",
          simple:  "C'est quel bus?",
        },
      },
      {
        id: 'dir_right',
        ko: '이 방향이 맞나요?',
        en: {
          natural: "Am I going the right way?",
          polite:  "Am I heading in the right direction?",
          simple:  "Is this right?",
        },
        fr: {
          natural: "Je vais dans la bonne direction?",
          polite:  "Est-ce que je me dirige dans la bonne direction?",
          simple:  "C'est par là?",
        },
      },
      {
        id: 'dir_show',
        ko: '지도에서 보여주실 수 있어요?',
        en: {
          natural: "Can you show me on the map?",
          polite:  "Would you mind showing me on the map?",
          simple:  "Show me on map?",
        },
        fr: {
          natural: "Vous pouvez me montrer sur la carte?",
          polite:  "Pourriez-vous me montrer sur la carte?",
          simple:  "Sur la carte?",
        },
      },
      {
        id: 'dir_slow',
        ko: '천천히 다시 말씀해 주실 수 있어요?',
        en: {
          natural: "Sorry, could you say that a bit slower?",
          polite:  "Could you please repeat that more slowly?",
          simple:  "Slowly please?",
        },
        fr: {
          natural: "Désolé(e), vous pouvez répéter plus lentement?",
          polite:  "Pourriez-vous répéter plus lentement s'il vous plaît?",
          simple:  "Plus lentement?",
        },
      },
    ],
  },

  // ─── 5. 전화하기 ─────────────────────────────────────────────────────────────
  {
    id: 'phone',
    icon: '📞',
    ko: '전화하기',
    en: 'On the Phone',
    fr: 'Au téléphone',
    situations: [
      {
        id: 'phone_intro',
        ko: '저 ○○이라고 하는데요',
        en: {
          natural: "Hi, this is ○○ calling.",
          polite:  "Good morning/afternoon, my name is ○○.",
          simple:  "Hello, I'm ○○.",
        },
        fr: {
          natural: "Bonjour, c'est ○○ à l'appareil.",
          polite:  "Bonjour, je me nomme ○○.",
          simple:  "Bonjour, c'est ○○.",
        },
      },
      {
        id: 'phone_speak',
        ko: '○○ 씨와 통화할 수 있을까요?',
        en: {
          natural: "Is ○○ around?",
          polite:  "Could I speak with ○○ please?",
          simple:  "Can I talk to ○○?",
        },
        fr: {
          natural: "○○ est là?",
          polite:  "Pourrais-je parler à ○○ s'il vous plaît?",
          simple:  "○○ est disponible?",
        },
      },
      {
        id: 'phone_repeat',
        ko: '다시 한번 말씀해 주실 수 있어요?',
        en: {
          natural: "Sorry, I didn't catch that — could you say it again?",
          polite:  "I beg your pardon, could you please repeat that?",
          simple:  "Could you repeat that?",
        },
        fr: {
          natural: "Désolé(e), j'ai pas compris — vous pouvez répéter?",
          polite:  "Je m'excuse, pourriez-vous répéter?",
          simple:  "Pouvez-vous répéter?",
        },
      },
      {
        id: 'phone_slow',
        ko: '좀 더 천천히 말씀해 주세요',
        en: {
          natural: "Could you slow down a little bit?",
          polite:  "Could you speak a little more slowly please?",
          simple:  "Slowly please.",
        },
        fr: {
          natural: "Vous pouvez parler un peu plus lentement?",
          polite:  "Pourriez-vous parler plus lentement s'il vous plaît?",
          simple:  "Plus lentement s'il vous plaît.",
        },
      },
      {
        id: 'phone_callback',
        ko: '나중에 다시 전화할게요',
        en: {
          natural: "I'll try calling back a bit later.",
          polite:  "I'll call back at a more convenient time.",
          simple:  "I'll call back later.",
        },
        fr: {
          natural: "Je vais rappeler un peu plus tard.",
          polite:  "Je rappellerai à un moment plus opportun.",
          simple:  "Je rappelle plus tard.",
        },
      },
      {
        id: 'phone_message',
        ko: '메시지 남겨도 될까요?',
        en: {
          natural: "Can I leave a message?",
          polite:  "Would it be possible to leave a message?",
          simple:  "Message please.",
        },
        fr: {
          natural: "Je peux laisser un message?",
          polite:  "Serait-il possible de laisser un message?",
          simple:  "Un message s'il vous plaît.",
        },
      },
      {
        id: 'phone_appointment',
        ko: '예약을 하고 싶은데요',
        en: {
          natural: "I'd like to make an appointment.",
          polite:  "I would like to book an appointment please.",
          simple:  "An appointment please.",
        },
        fr: {
          natural: "Je voudrais prendre un rendez-vous.",
          polite:  "J'aimerais prendre un rendez-vous s'il vous plaît.",
          simple:  "Un rendez-vous s'il vous plaît.",
        },
      },
      {
        id: 'phone_confirm',
        ko: '제가 제대로 이해한 게 맞나요?',
        en: {
          natural: "Just to make sure I got that right —",
          polite:  "Could you confirm that for me?",
          simple:  "Is that correct?",
        },
        fr: {
          natural: "Juste pour être sûr(e) que j'ai bien compris —",
          polite:  "Pourriez-vous confirmer cela?",
          simple:  "C'est bien ça?",
        },
      },
    ],
  },

  // ─── 6. 병원/약국 ─────────────────────────────────────────────────────────────
  {
    id: 'medical',
    icon: '🏥',
    ko: '병원/약국',
    en: 'Medical / Pharmacy',
    fr: 'Médecin / Pharmacie',
    situations: [
      {
        id: 'med_appointment',
        ko: '진료 예약을 하고 싶어요',
        en: {
          natural: "I'd like to book an appointment with a doctor.",
          polite:  "I would like to schedule a medical appointment please.",
          simple:  "I need an appointment.",
        },
        fr: {
          natural: "Je voudrais prendre un rendez-vous avec un médecin.",
          polite:  "J'aimerais prendre rendez-vous avec un médecin s'il vous plaît.",
          simple:  "Un rendez-vous s'il vous plaît.",
        },
      },
      {
        id: 'med_headache',
        ko: '머리가 아파요',
        en: {
          natural: "I've got a pretty bad headache.",
          polite:  "I'm experiencing a headache.",
          simple:  "My head hurts.",
        },
        fr: {
          natural: "J'ai vraiment mal à la tête.",
          polite:  "Je souffre de maux de tête.",
          simple:  "J'ai mal à la tête.",
        },
      },
      {
        id: 'med_stomach',
        ko: '배가 아파요',
        en: {
          natural: "My stomach's been hurting.",
          polite:  "I'm having stomach pains.",
          simple:  "My stomach hurts.",
        },
        fr: {
          natural: "J'ai mal au ventre depuis un moment.",
          polite:  "J'ai des douleurs à l'estomac.",
          simple:  "J'ai mal au ventre.",
        },
      },
      {
        id: 'med_fever',
        ko: '열이 나요',
        en: {
          natural: "I think I have a fever.",
          polite:  "I appear to have a fever.",
          simple:  "I have a fever.",
        },
        fr: {
          natural: "Je crois que j'ai de la fièvre.",
          polite:  "Il me semble que j'ai de la fièvre.",
          simple:  "J'ai de la fièvre.",
        },
      },
      {
        id: 'med_allergy',
        ko: '이 약에 알레르기가 있어요',
        en: {
          natural: "I'm allergic to this.",
          polite:  "I have an allergy to this medication.",
          simple:  "I'm allergic.",
        },
        fr: {
          natural: "Je suis allergique à ça.",
          polite:  "J'ai une allergie à ce médicament.",
          simple:  "Je suis allergique.",
        },
      },
      {
        id: 'med_howto',
        ko: '이 약 어떻게 먹어요?',
        en: {
          natural: "How am I supposed to take this?",
          polite:  "Could you explain how to take this medication?",
          simple:  "How to take it?",
        },
        fr: {
          natural: "Comment je prends ça?",
          polite:  "Pourriez-vous m'expliquer comment prendre ce médicament?",
          simple:  "Comment le prendre?",
        },
      },
      {
        id: 'med_pharmacy',
        ko: '약국이 어디에 있어요?',
        en: {
          natural: "Is there a pharmacy nearby?",
          polite:  "Could you tell me where the nearest pharmacy is?",
          simple:  "Where is a pharmacy?",
        },
        fr: {
          natural: "Il y a une pharmacie près d'ici?",
          polite:  "Pourriez-vous me dire où est la pharmacie la plus proche?",
          simple:  "Où est la pharmacie?",
        },
      },
      {
        id: 'med_emergency',
        ko: '응급실이 어디예요?',
        en: {
          natural: "Where's the ER?",
          polite:  "Could you direct me to the emergency room?",
          simple:  "Emergency room please.",
        },
        fr: {
          natural: "Les urgences, c'est où?",
          polite:  "Pourriez-vous m'indiquer les urgences?",
          simple:  "Les urgences s'il vous plaît.",
        },
      },
    ],
  },

  // ─── 7. 집 구하기 ─────────────────────────────────────────────────────────────
  {
    id: 'housing',
    icon: '🏠',
    ko: '집 구하기',
    en: 'Finding Housing',
    fr: 'Chercher un logement',
    situations: [
      {
        id: 'house_available',
        ko: '방 있어요?',
        en: {
          natural: "Do you have any rooms available?",
          polite:  "I was wondering if you have any units available.",
          simple:  "Any rooms available?",
        },
        fr: {
          natural: "Vous avez des chambres de disponibles?",
          polite:  "Je me demandais si vous aviez des logements disponibles.",
          simple:  "Une chambre disponible?",
        },
      },
      {
        id: 'house_rent',
        ko: '월세가 얼마예요?',
        en: {
          natural: "How much is the rent per month?",
          polite:  "What is the monthly rental price?",
          simple:  "How much per month?",
        },
        fr: {
          natural: "Le loyer c'est combien par mois?",
          polite:  "Quel est le loyer mensuel?",
          simple:  "C'est combien par mois?",
        },
      },
      {
        id: 'house_utilities',
        ko: '유틸리티 포함이에요?',
        en: {
          natural: "Are the utilities included in the rent?",
          polite:  "Are utilities included with the rent?",
          simple:  "Utilities included?",
        },
        fr: {
          natural: "Les charges sont incluses dans le loyer?",
          polite:  "Est-ce que les services publics sont inclus?",
          simple:  "Charges comprises?",
        },
      },
      {
        id: 'house_when',
        ko: '언제부터 입주 가능해요?',
        en: {
          natural: "When would it be available to move in?",
          polite:  "What would the earliest available move-in date be?",
          simple:  "When can I move in?",
        },
        fr: {
          natural: "C'est disponible à partir de quand?",
          polite:  "Quelle serait la date d'emménagement la plus tôt possible?",
          simple:  "Disponible quand?",
        },
      },
      {
        id: 'house_deposit',
        ko: '보증금이 얼마예요?',
        en: {
          natural: "How much is the deposit?",
          polite:  "What is the amount of the security deposit?",
          simple:  "Deposit amount?",
        },
        fr: {
          natural: "C'est combien le dépôt de garantie?",
          polite:  "Quel est le montant du dépôt de garantie?",
          simple:  "Le dépôt?",
        },
      },
      {
        id: 'house_lease',
        ko: '계약서 볼 수 있어요?',
        en: {
          natural: "Can I take a look at the lease?",
          polite:  "Would it be possible to see the lease agreement?",
          simple:  "Can I see the lease?",
        },
        fr: {
          natural: "Je peux voir le bail?",
          polite:  "Serait-il possible de voir le contrat de bail?",
          simple:  "Le bail s'il vous plaît.",
        },
      },
      {
        id: 'house_furnished',
        ko: '가구가 있는 방이에요?',
        en: {
          natural: "Is the room furnished?",
          polite:  "Is the room furnished or unfurnished?",
          simple:  "Is it furnished?",
        },
        fr: {
          natural: "La chambre est meublée?",
          polite:  "La chambre est-elle meublée ou non meublée?",
          simple:  "C'est meublé?",
        },
      },
      {
        id: 'house_visit',
        ko: '방 보러 가도 될까요?',
        en: {
          natural: "Could I come have a look at the place?",
          polite:  "Would it be possible to schedule a viewing?",
          simple:  "Can I visit?",
        },
        fr: {
          natural: "Je pourrais venir voir le logement?",
          polite:  "Serait-il possible de planifier une visite?",
          simple:  "Je peux visiter?",
        },
      },
    ],
  },

  // ─── 8. 알바/면접 ─────────────────────────────────────────────────────────────
  {
    id: 'interview',
    icon: '💼',
    ko: '알바/면접',
    en: 'Job Interview',
    fr: 'Entretien d\'embauche',
    situations: [
      {
        id: 'int_introduce',
        ko: '자기소개를 해도 될까요?',
        en: {
          natural: "I'd love to tell you a little about myself.",
          polite:  "Allow me to introduce myself.",
          simple:  "May I introduce myself?",
        },
        fr: {
          natural: "J'aimerais vous parler un peu de moi.",
          polite:  "Permettez-moi de me présenter.",
          simple:  "Je me présente.",
        },
      },
      {
        id: 'int_experience',
        ko: '저는 이쪽 일 해본 적 있어요',
        en: {
          natural: "I've done this kind of work before.",
          polite:  "I have experience in this type of role.",
          simple:  "I have experience.",
        },
        fr: {
          natural: "J'ai déjà fait ce genre de travail.",
          polite:  "J'ai de l'expérience dans ce type de poste.",
          simple:  "J'ai de l'expérience.",
        },
      },
      {
        id: 'int_schedule',
        ko: '언제부터 일할 수 있어요?',
        en: {
          natural: "I can start pretty much whenever works for you.",
          polite:  "I'm available to start at your convenience.",
          simple:  "I can start anytime.",
        },
        fr: {
          natural: "Je peux commencer quand ça vous arrange.",
          polite:  "Je suis disponible dès que vous le souhaitez.",
          simple:  "Je peux commencer quand vous voulez.",
        },
      },
      {
        id: 'int_hours',
        ko: '몇 시간 근무예요?',
        en: {
          natural: "How many hours per week would this be?",
          polite:  "Could you tell me the expected hours per week?",
          simple:  "How many hours?",
        },
        fr: {
          natural: "C'est combien d'heures par semaine?",
          polite:  "Pourriez-vous me dire les heures prévues par semaine?",
          simple:  "Combien d'heures?",
        },
      },
      {
        id: 'int_wage',
        ko: '시급이 얼마예요?',
        en: {
          natural: "What's the hourly rate for this position?",
          polite:  "Could you tell me the hourly wage?",
          simple:  "What's the pay?",
        },
        fr: {
          natural: "C'est quoi le taux horaire pour ce poste?",
          polite:  "Pourriez-vous me dire le salaire horaire?",
          simple:  "C'est combien de l'heure?",
        },
      },
      {
        id: 'int_language',
        ko: '불어를 배우고 있는 중이에요',
        en: {
          natural: "I'm currently learning French.",
          polite:  "I am in the process of learning French.",
          simple:  "I'm learning French.",
        },
        fr: {
          natural: "Je suis en train d'apprendre le français.",
          polite:  "Je suis actuellement en apprentissage du français.",
          simple:  "J'apprends le français.",
        },
      },
      {
        id: 'int_question',
        ko: '질문해도 될까요?',
        en: {
          natural: "Can I ask you something?",
          polite:  "May I ask a question?",
          simple:  "Can I ask?",
        },
        fr: {
          natural: "Je peux vous poser une question?",
          polite:  "Puis-je vous poser une question?",
          simple:  "Une question?",
        },
      },
      {
        id: 'int_followup',
        ko: '결과는 언제 알 수 있어요?',
        en: {
          natural: "When do you think you'll be making a decision?",
          polite:  "When might I expect to hear back?",
          simple:  "When will I know?",
        },
        fr: {
          natural: "Vous pensez décider quand?",
          polite:  "Quand puis-je espérer avoir des nouvelles?",
          simple:  "Vous répondez quand?",
        },
      },
    ],
  },

  // ─── 9. 사과/양해 ─────────────────────────────────────────────────────────────
  {
    id: 'apology',
    icon: '🙏',
    ko: '사과/양해',
    en: 'Apology / Excuse',
    fr: 'Excuse / Pardon',
    situations: [
      {
        id: 'apo_sorry',
        ko: '죄송해요',
        en: {
          natural: "I'm so sorry about that.",
          polite:  "I sincerely apologize.",
          simple:  "I'm sorry.",
        },
        fr: {
          natural: "Je suis vraiment désolé(e).",
          polite:  "Je vous présente mes sincères excuses.",
          simple:  "Désolé(e).",
        },
      },
      {
        id: 'apo_french',
        ko: '불어를 잘 못해요',
        en: {
          natural: "My French is still a work in progress.",
          polite:  "I apologize, my French is limited.",
          simple:  "My French is not good.",
        },
        fr: {
          natural: "Mon français est encore en développement.",
          polite:  "Je m'excuse, mon français est limité.",
          simple:  "Mon français est pas bon.",
        },
      },
      {
        id: 'apo_understand',
        ko: '잘 이해를 못했어요',
        en: {
          natural: "I didn't quite get that, I'm sorry.",
          polite:  "I'm afraid I didn't understand, I apologize.",
          simple:  "I didn't understand.",
        },
        fr: {
          natural: "J'ai pas bien compris, désolé(e).",
          polite:  "Je crains de ne pas avoir compris, je m'excuse.",
          simple:  "Je n'ai pas compris.",
        },
      },
      {
        id: 'apo_mistake',
        ko: '제가 실수했어요',
        en: {
          natural: "I made a mistake, sorry about that.",
          polite:  "I made an error, I apologize.",
          simple:  "I made a mistake.",
        },
        fr: {
          natural: "J'ai fait une erreur, désolé(e).",
          polite:  "J'ai commis une erreur, je m'en excuse.",
          simple:  "J'ai fait une erreur.",
        },
      },
      {
        id: 'apo_late',
        ko: '늦어서 죄송해요',
        en: {
          natural: "Sorry I'm late!",
          polite:  "I apologize for my tardiness.",
          simple:  "Sorry, I'm late.",
        },
        fr: {
          natural: "Désolé(e) d'être en retard!",
          polite:  "Je m'excuse pour mon retard.",
          simple:  "Désolé(e), je suis en retard.",
        },
      },
      {
        id: 'apo_excuseme',
        ko: '잠깐 실례해도 될까요?',
        en: {
          natural: "Hey, excuse me real quick.",
          polite:  "Excuse me, may I interrupt for a moment?",
          simple:  "Excuse me.",
        },
        fr: {
          natural: "Excusez-moi une seconde.",
          polite:  "Excusez-moi, puis-je vous interrompre un instant?",
          simple:  "Excusez-moi.",
        },
      },
      {
        id: 'apo_bump',
        ko: '죄송해요, 제가 부딪혔어요',
        en: {
          natural: "Oh sorry, I bumped into you!",
          polite:  "I beg your pardon, I didn't mean to bump into you.",
          simple:  "Sorry!",
        },
        fr: {
          natural: "Oh désolé(e), je vous ai rentré dedans!",
          polite:  "Je vous demande pardon, je ne voulais pas vous bousculer.",
          simple:  "Pardon!",
        },
      },
      {
        id: 'apo_noproblem',
        ko: '괜찮아요, 걱정 마세요',
        en: {
          natural: "No worries at all!",
          polite:  "Please don't worry, it's quite alright.",
          simple:  "No problem.",
        },
        fr: {
          natural: "Pas de souci du tout!",
          polite:  "Ne vous en faites pas, c'est tout à fait correct.",
          simple:  "Pas de problème.",
        },
      },
    ],
  },

  // ─── 10. 다시 말해달라고 하기 ──────────────────────────────────────────────────
  {
    id: 'repeat',
    icon: '🔁',
    ko: '다시 말해달라고',
    en: 'Ask to Repeat',
    fr: 'Demander de répéter',
    situations: [
      {
        id: 'rep_again',
        ko: '다시 한번 말씀해 주실 수 있어요?',
        en: {
          natural: "Sorry, could you say that again?",
          polite:  "Could you please repeat that?",
          simple:  "Again please?",
        },
        fr: {
          natural: "Désolé(e), vous pouvez répéter?",
          polite:  "Pourriez-vous répéter s'il vous plaît?",
          simple:  "Encore une fois?",
        },
      },
      {
        id: 'rep_slow',
        ko: '좀 더 천천히 말씀해 주세요',
        en: {
          natural: "Could you go a little slower?",
          polite:  "Could you please speak more slowly?",
          simple:  "More slowly please.",
        },
        fr: {
          natural: "Vous pouvez parler un peu plus lentement?",
          polite:  "Pourriez-vous parler plus lentement s'il vous plaît?",
          simple:  "Plus lentement.",
        },
      },
      {
        id: 'rep_write',
        ko: '써주실 수 있어요?',
        en: {
          natural: "Could you write that down for me?",
          polite:  "Would you mind writing that down?",
          simple:  "Write it please?",
        },
        fr: {
          natural: "Vous pouvez me l'écrire?",
          polite:  "Pourriez-vous me l'écrire?",
          simple:  "Écrivez s'il vous plaît.",
        },
      },
      {
        id: 'rep_show',
        ko: '보여주실 수 있어요?',
        en: {
          natural: "Can you show me?",
          polite:  "Would you mind showing me?",
          simple:  "Show me?",
        },
        fr: {
          natural: "Vous pouvez me montrer?",
          polite:  "Pourriez-vous me montrer?",
          simple:  "Montrez-moi?",
        },
      },
      {
        id: 'rep_spell',
        ko: '스펠링 알려주세요',
        en: {
          natural: "How do you spell that?",
          polite:  "Could you spell that for me?",
          simple:  "Spell it please?",
        },
        fr: {
          natural: "Vous pouvez épeler ça?",
          polite:  "Pourriez-vous épeler cela?",
          simple:  "L'épellation?",
        },
      },
      {
        id: 'rep_understand',
        ko: '제가 맞게 이해한 건가요?',
        en: {
          natural: "Did I get that right?",
          polite:  "Am I understanding you correctly?",
          simple:  "Is that right?",
        },
        fr: {
          natural: "J'ai bien compris?",
          polite:  "Est-ce que je vous comprends correctement?",
          simple:  "C'est bien ça?",
        },
      },
      {
        id: 'rep_simpler',
        ko: '더 쉬운 말로 해주실 수 있어요?',
        en: {
          natural: "Could you put it in simpler words?",
          polite:  "Could you explain that in simpler terms?",
          simple:  "Simpler please?",
        },
        fr: {
          natural: "Vous pouvez dire ça plus simplement?",
          polite:  "Pourriez-vous l'expliquer en termes plus simples?",
          simple:  "Plus simple?",
        },
      },
      {
        id: 'rep_phone_bad',
        ko: '전화 상태가 좋지 않아요',
        en: {
          natural: "Sorry, you're breaking up a bit.",
          polite:  "I'm sorry, the connection isn't very clear.",
          simple:  "Bad connection.",
        },
        fr: {
          natural: "Désolé(e), vous coupez un peu.",
          polite:  "Je m'excuse, la connexion n'est pas très claire.",
          simple:  "Mauvaise connexion.",
        },
      },
    ],
  },
]

// ─── Emergency phrases ────────────────────────────────────────────────────────

export interface EmergencyPhrase {
  ko: string
  en: string
  fr: string
}

export const EMERGENCY_PHRASES: EmergencyPhrase[] = [
  {
    ko: '죄송해요, 영어/불어가 완벽하지 않아요.',
    en: "Sorry, my English isn't perfect.",
    fr: "Désolé(e), mon français n'est pas parfait.",
  },
  {
    ko: '천천히 다시 말씀해 주시겠어요?',
    en: "Could you say that again slowly?",
    fr: "Pouvez-vous répéter plus lentement?",
  },
  {
    ko: '이 문장을 보여드려도 될까요?',
    en: "Can I show you this sentence?",
    fr: "Je peux vous montrer cette phrase?",
  },
  {
    ko: '잠깐만요.',
    en: "One moment, please.",
    fr: "Un instant, s'il vous plaît.",
  },
  {
    ko: '불어를 아직 배우는 중이에요.',
    en: "I'm still learning French.",
    fr: "J'apprends encore le français.",
  },
  {
    ko: '써주실 수 있어요?',
    en: "Could you write that down?",
    fr: "Pouvez-vous l'écrire?",
  },
  {
    ko: '도움이 필요해요.',
    en: "I need some help.",
    fr: "J'ai besoin d'aide.",
  },
]
