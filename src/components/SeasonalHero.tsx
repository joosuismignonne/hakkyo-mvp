import type { SeasonTheme } from '../lib/seasonTheme'
import SeasonalLayer from './SeasonalLayer'

interface Props {
  theme: SeasonTheme
}

export default function SeasonalHero({ theme }: Props) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl mb-7 px-7 py-10 md:py-12"
      style={{ background: theme.heroBg }}
    >
      {/* Particle layer — behind all content */}
      <SeasonalLayer type={theme.particle} color={theme.particleColor} />

      {/* Content */}
      <div className="relative z-10">

        {/* Season label */}
        <p
          className="text-[9px] font-semibold tracking-[0.30em] uppercase mb-6"
          style={{ color: theme.accent }}
        >
          {theme.label.fr} · {theme.label.en} · {theme.label.ko}
        </p>

        {/* Main heading — FR primary, EN/KO secondary */}
        <div className="mb-4">
          <p
            className="text-[20px] md:text-[24px] font-light tracking-tight leading-tight mb-2"
            style={{ color: theme.heroHeading }}
          >
            Un petit jardin à Montréal.
          </p>
          <p
            className="text-[12px] leading-snug"
            style={{ color: theme.heroBody, opacity: 0.68 }}
          >
            A small garden in Montreal.
          </p>
          <p
            className="text-[11px] leading-snug mt-0.5"
            style={{ color: theme.heroBody, opacity: 0.56 }}
          >
            몬트리올의 작은 정원.
          </p>
        </div>

        {/* Subline — French only, kept to one breath */}
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: theme.heroBody, opacity: 0.50, maxWidth: 360 }}
        >
          Un espace pour apprendre, se rencontrer, se reposer et grandir.
        </p>

      </div>
    </div>
  )
}
