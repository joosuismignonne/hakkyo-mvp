export type Season   = 'spring' | 'summer' | 'autumn' | 'rainy' | 'winter'
export type Particle = 'snow'   | 'rain'   | 'petals' | 'none'

export interface SeasonTheme {
  season:          Season
  label:           { fr: string; en: string; ko: string }
  // What the garden shows this season
  fullBloom:       boolean   // flowers fully open
  showButterfly:   boolean   // butterfly crosses the scene
  showBuds:        boolean   // buds visible (spring only)
  showSeedHeads:   boolean   // dried seed heads (autumn)
  particle:        Particle  // falling particles above the garden
  particleColor:   string
}

export const THEMES: Record<Season, SeasonTheme> = {
  spring: {
    season:        'spring',
    label:         { fr: 'Printemps', en: 'Spring', ko: '봄' },
    fullBloom:     false,
    showButterfly: true,
    showBuds:      true,
    showSeedHeads: false,
    particle:      'petals',
    particleColor: '#d494a0',
  },
  summer: {
    season:        'summer',
    label:         { fr: 'Été', en: 'Summer', ko: '여름' },
    fullBloom:     true,
    showButterfly: true,
    showBuds:      false,
    showSeedHeads: false,
    particle:      'none',
    particleColor: '#f0c830',
  },
  autumn: {
    season:        'autumn',
    label:         { fr: 'Automne', en: 'Autumn', ko: '가을' },
    fullBloom:     false,
    showButterfly: false,
    showBuds:      false,
    showSeedHeads: true,
    particle:      'none',
    particleColor: '#b06828',
  },
  rainy: {
    season:        'rainy',
    label:         { fr: 'Pluie', en: 'Rain', ko: '비' },
    fullBloom:     true,
    showButterfly: false,
    showBuds:      false,
    showSeedHeads: false,
    particle:      'rain',
    particleColor: '#88a8c0',
  },
  winter: {
    season:        'winter',
    label:         { fr: 'Hiver', en: 'Winter', ko: '겨울' },
    fullBloom:     false,
    showButterfly: false,
    showBuds:      false,
    showSeedHeads: false,
    particle:      'snow',
    particleColor: '#b0b8d0',
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
