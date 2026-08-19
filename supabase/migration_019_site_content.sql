-- Site content table for admin-editable content
CREATE TABLE IF NOT EXISTS site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT NOT NULL,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  value_ko TEXT DEFAULT '',
  value_en TEXT DEFAULT '',
  value_fr TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (page, key)
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON site_content FOR SELECT USING (true);
CREATE POLICY "Auth update" ON site_content FOR ALL USING (auth.role() = 'authenticated');

-- Seed: Book Club
INSERT INTO site_content (page, key, label, value_ko, value_en, value_fr) VALUES
('activity_book-club', 'leader_quote',    'Joy 클럽 소개',
  '북클럽을 하고 싶었던 이유는 우리가 가끔은 그냥 앉아서 책을 읽는 게 얼마나 즐겁고 힐링인지 잊어버리는 것 같아서요! 이런 취미를 함께 나누면 더 많이 읽고 싶어지고, 새로운 책들도 읽어보고 싶어지지 않을까 생각했어요. 또 언어 공부와 독서를 같이 하면, 배우고 있는 언어로 대화 연습을 하는 재미있는 방법이 될 수 있다고 생각해요! 그래서 프랑스어, 영어, 한국어 중 하나를 연습하면서, 지금 읽고 있는 책이나 읽고 싶은 책, 또는 이미 읽은 책에 대해 함께 이야기해요!',
  'I wanted to do the book club because I think we sometimes forget how fun and healing it can be to just sit down and read a book! I feel like sharing that passion is a good way to make you want to read more and read new books! I also think that mixing language learning and book reading can be a fun way to practice the language you are learning! Come join us to practice French, English or Korean while talking about the books you are reading, want to read, or have already read!',
  'La raison pourquoi je voulais faire le book club c''est parce que des fois on oublie à quel point c''est le fun et healing de juste s''asseoir pour un moment et lire un livre! Je crois aussi que mélanger l''apprentissage d''une langue avec la passion pour les livres peut être une façon le fun de pratiquer la langue que tu apprends! Bref, viens nous rejoindre pour pratiquer ton français, anglais ou coréen en parlant des livres que tu lis, que tu veux lire ou que tu as déjà lu!'
),
('activity_running-club', 'leader_quote', 'Joo 클럽 소개',
  '', '', ''
),
('activity_boardgame-club', 'leader_quote', 'Jaehee 클럽 소개',
  '', '', ''
),
-- Home page content
('home', 'hero_title',     '히어로 메인 문장',   '', 'How do we help people build real relationships through language?', ''),
('home', 'hero_sub',       '히어로 서브 문장',   '사람을 만나며 언어를 배우는 Montréal Learning Community', '', ''),
('home', 'hero_bottom',    '히어로 하단 설명',   '사람은 낯선 도시에서 어떻게 배우고, 연결되고, 자기 삶을 만들어가는가. HAKKYO는 그 질문에서 시작한 Montréal Learning Community입니다.', '', '')
-- Before you join — prep cards (pipe-separated list: item1|item2|item3)
('activity_book-club', 'prep_items', 'Before You Join 준비물',
  '읽고 싶은 책 한 권 (선택)|필기구|편하게 이야기할 마음',
  'One book you want to read (optional)|Notebook or pen|An open mind to chat',
  'Un livre que tu veux lire (optionnel)|Un carnet ou un stylo|L''envie de discuter'
),
('activity_running-club', 'prep_items', 'Before You Join 준비물',
  '편한 러닝화|물|가볍게 달릴 마음',
  'Comfortable running shoes|Water|A light spirit',
  'Des chaussures confortables|De l''eau|L''envie de courir'
),
('activity_boardgame-club', 'prep_items', 'Before You Join 준비물',
  '준비물 없음|게임과 도구는 제공|함께 웃을 준비',
  'Nothing to bring|Games and tools provided|Ready to laugh',
  'Rien à apporter|Jeux et matériel fournis|Prêt·e à rire'
)
ON CONFLICT (page, key) DO UPDATE
  SET value_ko = EXCLUDED.value_ko,
      value_en = EXCLUDED.value_en,
      value_fr = EXCLUDED.value_fr,
      updated_at = NOW();
