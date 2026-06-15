import { useMemo } from 'react'
import type { Particle } from '../lib/seasonTheme'

interface Props {
  type:      Particle
  color:     string
  className?: string
}

// Deterministic pseudo-random seeded by particle index + day-of-month.
// Particles shift daily but are stable within a session.
function sr(n: number): number {
  const x = Math.sin(n + 1) * 99991
  return x - Math.floor(x)
}

interface Pt {
  id:    number
  left:  number   // % from left
  delay: number   // animation-delay (s)
  dur:   number   // animation-duration (s)
  size:  number   // base size (px)
  op:    number   // opacity
  r0:    number   // initial rotation (deg) — petals / leaves
  dx:    number   // horizontal drift (px)  — petals / leaves
}

const COUNTS: Record<Particle, number> = {
  snow:   22,
  rain:   32,
  petals: 13,
  leaves:  9,
  none:    0,
}

function makeParticles(type: Particle): Pt[] {
  const n   = COUNTS[type]
  const day = new Date().getDate()
  return Array.from({ length: n }, (_, i) => ({
    id:    i,
    left:  sr(day + i * 7)     * 100,
    delay: sr(day + i * 13)    * 14,
    dur:   7 + sr(day + i * 3)  * 10,
    size:  3 + sr(day + i * 17) * 4,
    op:    0.22 + sr(day + i * 5) * 0.58,
    r0:    sr(day + i * 11)    * 360,
    dx:    (sr(day + i * 19) - 0.5) * 52,
  }))
}

export default function SeasonalLayer({ type, color, className = '' }: Props) {
  const pts = useMemo(() => makeParticles(type), [type])
  if (type === 'none') return null

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      {pts.map(p => {
        const base: React.CSSProperties = {
          position:          'absolute',
          left:              `${p.left}%`,
          top:               -20,
          opacity:           p.op,
          animationDelay:    `${p.delay}s`,
          animationDuration: `${p.dur}s`,
          display:           'block',
        }

        if (type === 'snow') return (
          <span key={p.id} className="sn-snow" style={{
            ...base,
            width:        p.size,
            height:       p.size,
            borderRadius: '50%',
            background:   color,
          }} />
        )

        if (type === 'rain') return (
          <span key={p.id} className="sn-rain" style={{
            ...base,
            width:      1.2,
            height:     p.size * 3 + 10,
            background: `linear-gradient(transparent, ${color})`,
          }} />
        )

        if (type === 'petals') return (
          <span key={p.id} className="sn-petal" style={{
            ...base,
            '--r0': `${p.r0}deg`,
            '--dx': `${p.dx}px`,
          } as React.CSSProperties}>
            <svg width={p.size * 2} height={p.size * 3} viewBox="0 0 10 15">
              <ellipse cx="5" cy="7.5" rx="4.2" ry="6.8" fill={color} />
            </svg>
          </span>
        )

        if (type === 'leaves') return (
          <span key={p.id} className="sn-leaf" style={{
            ...base,
            '--r0': `${p.r0}deg`,
            '--dx': `${p.dx}px`,
          } as React.CSSProperties}>
            <svg width={p.size * 2.5} height={p.size * 3} viewBox="0 0 14 18">
              <path
                d="M7 1C12 3.5 13.5 9 11 13.5C9 17 4 17.5 2 15C0 12 2 5 7 1Z"
                fill={color}
              />
              <line x1="7" y1="1.5" x2="6.5" y2="15" stroke={color} strokeOpacity="0.3" strokeWidth="0.7" />
            </svg>
          </span>
        )

        return null
      })}
    </div>
  )
}
