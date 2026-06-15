export type Season   = 'spring' | 'summer' | 'autumn' | 'rainy' | 'winter'
export type Particle = 'snow'   | 'rain'   | 'petals' | 'leaves' | 'none'

export interface SeasonTheme {
  season:        Season
  label:         { fr: string; en: string; ko: string }
  bodyBg:        string   // page-level gradient
  heroBg:        string   // hero card gradient (richer)
  accent:        string   // season accent color
  accentSoft:    string   // tinted accent for borders / soft elements
  heroHeading:   string   // hero large text color
  heroBody:      string   // hero secondary text color
  particle:      Particle
  particleColor: string
}

export const THEMES: Record<Season, SeasonTheme> = {
  spring: {
    season:        'spring',
    label:         { fr: 'Printemps', en: 'Spring', ko: '봄' },
    bodyBg:        'linear-gradient(180deg,#e6f3ec 0%,#f1f8f4 55%,#f6faf8 100%)',
    heroBg:        'linear-gradient(155deg,#c8e4d8 0%,#d4ecdc 55%,#e2f2e8 100%)',
    accent:        '#336650',
    accentSoft:    '#a0ccb8',
    heroHeading:   '#12301e',
    heroBody:      '#2e5440',
    particle:      'petals',
    particleColor: '#c88898',
  },
  summer: {
    season:        'summer',
    label:         { fr: 'Été', en: 'Summer', ko: '여름' },
    bodyBg:        'linear-gradient(180deg,#fcf2e0 0%,#f8f4ea 55%,#f6f4ee 100%)',
    heroBg:        'linear-gradient(155deg,#f4e4c4 0%,#f0e0c4 55%,#ebe0c2 100%)',
    accent:        '#845420',
    accentSoft:    '#d8bc88',
    heroHeading:   '#241400',
    heroBody:      '#5c3c18',
    particle:      'none',
    particleColor: '#f0c830',
  },
  autumn: {
    season:        'autumn',
    label:         { fr: 'Automne', en: 'Autumn', ko: '가을' },
    bodyBg:        'linear-gradient(180deg,#f0e6d4 0%,#f4ece6 55%,#f5f0ec 100%)',
    heroBg:        'linear-gradient(155deg,#e0c8a0 0%,#dcc4a0 55%,#d8c09c 100%)',
    accent:        '#783618',
    accentSoft:    '#c89878',
    heroHeading:   '#1c0800',
    heroBody:      '#582810',
    particle:      'leaves',
    particleColor: '#a85018',
  },
  rainy: {
    season:        'rainy',
    label:         { fr: 'Pluie', en: 'Rain', ko: '비' },
    bodyBg:        'linear-gradient(180deg,#e2e8f2 0%,#e8eef8 55%,#ecf0f8 100%)',
    heroBg:        'linear-gradient(155deg,#c4d0e8 0%,#c8d4ec 55%,#d0dcea 100%)',
    accent:        '#344e6c',
    accentSoft:    '#98b0cc',
    heroHeading:   '#0e1a34',
    heroBody:      '#344860',
    particle:      'rain',
    particleColor: '#6088aa',
  },
  winter: {
    season:        'winter',
    label:         { fr: 'Hiver', en: 'Winter', ko: '겨울' },
    bodyBg:        'linear-gradient(180deg,#e4e8f4 0%,#e8eef8 55%,#ecf2f8 100%)',
    heroBg:        'linear-gradient(155deg,#ccd4ec 0%,#d0dcf4 55%,#d8e8f6 100%)',
    accent:        '#3c4880',
    accentSoft:    '#a8b4d8',
    heroHeading:   '#0e1848',
    heroBody:      '#384474',
    particle:      'snow',
    particleColor: '#a0b4d8',
  },
}

export function detectSeason(): Season {
  const m = new Date().getMonth()
  if (m >= 2 && m <= 4) return 'spring'
  if (m >= 5 && m <= 7) return 'summer'
  if (m >= 8 && m <= 10) return 'autumn'
  return 'winter'
}

export function getSeasonTheme(override?: Season): SeasonTheme {
  return THEMES[override ?? detectSeason()]
}
