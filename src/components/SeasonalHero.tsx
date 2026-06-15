/**
 * GardenHero — homepage hero that extends the HAKKYO logo into a living scene.
 *
 * Visual language: same as the logo — bold filled shapes, 5-petal blob flower,
 * yellow center, thick diagonal stems, scattered dots. Graphic and editorial,
 * not botanical illustration, not childish.
 *
 * The center of the scene is deliberately left open (sky). Flowers crowd the
 * edges. The user feels they are at the entrance to a garden, looking in.
 */

import type { SeasonTheme } from '../lib/seasonTheme'
import SeasonalLayer from './SeasonalLayer'

interface Props { theme: SeasonTheme }

// ─── Palette ─────────────────────────────────────────────────────────────────

// Primary flower: mirrors the logo
const DARK  = '#1c1e18'   // near-black fill (same as logo)
const YLW   = '#f2d020'   // yellow center (same as logo)
// Secondary flowers: tonal variants that stay in family
const SAGE  = '#3e4e38'   // dark sage — feels like garden in shadow
const EARTH = '#4a3a28'   // dark earth — warm variant
const CLOUD = '#ebebea'   // barely-there cloud fill

// ─── Flower (5-petal blob — logo DNA) ────────────────────────────────────────
// Petals: 5 circles at 72° intervals, overlapping at center.
// Same construction as the HAKKYO logo mark.

interface FlowerProps {
  cx: number; cy: number
  r?: number
  fill?: string
  center?: string
  opacity?: number
}

function Flower({ cx, cy, r = 13, fill = DARK, center = YLW, opacity = 1 }: FlowerProps) {
  const dist = r * 1.3   // distance from center to each petal center
  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * (Math.PI / 180)
    return { x: cx + Math.cos(a) * dist, y: cy + Math.sin(a) * dist }
  })
  return (
    <g opacity={opacity}>
      {/* core fill — connects petals */}
      <circle cx={cx} cy={cy} r={r * 0.95} fill={fill} />
      {/* 5 petals */}
      {petals.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={r} fill={fill} />
      ))}
      {/* yellow center */}
      <circle cx={cx} cy={cy} r={r * 0.52} fill={center} />
    </g>
  )
}

// ─── Bud (spring only — flower not yet open) ─────────────────────────────────

function Bud({ cx, cy, r = 9, fill = DARK }: { cx: number; cy: number; r?: number; fill?: string }) {
  return (
    <g>
      <circle cx={cx}             cy={cy - r * 0.4} r={r}            fill={fill} />
      <circle cx={cx - r * 0.6}  cy={cy + r * 0.2} r={r * 0.85}    fill={fill} />
      <circle cx={cx + r * 0.6}  cy={cy + r * 0.2} r={r * 0.85}    fill={fill} />
    </g>
  )
}

// ─── Seed head (autumn — dried flower) ───────────────────────────────────────

function SeedHead({ cx, cy, r = 1, fill = DARK }: { cx: number; cy: number; r?: number; fill?: string; opacity?: number }) {
  // Open ring with radiating dots — like a dried dandelion
  return (
    <g>
      <circle cx={cx} cy={cy} r={5 * r} fill="none" stroke={fill} strokeWidth={1.2 * r} strokeOpacity="0.4" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45) * (Math.PI / 180)
        const d = 9 * r
        return <circle key={i} cx={cx + Math.cos(a) * d} cy={cy + Math.sin(a) * d} r={1.8 * r} fill={fill} opacity="0.6" />
      })}
    </g>
  )
}

// ─── Stem (thick, diagonal — logo style) ─────────────────────────────────────

function Stem({ x1, y1, x2, y2, w = 3.5, fill = DARK }: {
  x1: number; y1: number; x2: number; y2: number; w?: number; fill?: string
}) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={fill} strokeWidth={w} strokeLinecap="round" />
}

// ─── Logo dot (small seed/period motif from the logo) ────────────────────────

function Dot({ cx, cy, r = 3.5, fill = DARK, opacity }: { cx: number; cy: number; r?: number; fill?: string; opacity?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill={fill} opacity={opacity} />
}

// ─── Cloud (blob — same language as flower petals) ───────────────────────────
// Defined at (0, 0); positioned via CSS animation translate.

function Cloud({ s = 1 }: { s?: number }) {
  return (
    <g fill={CLOUD}>
      <circle cx={0}       cy={0}        r={18 * s} />
      <circle cx={24 * s}  cy={-8 * s}   r={22 * s} />
      <circle cx={52 * s}  cy={-4 * s}   r={17 * s} />
      <circle cx={68 * s}  cy={4 * s}    r={13 * s} />
      <rect   x={0} y={0} width={68 * s} height={20 * s} />
    </g>
  )
}

// ─── Butterfly (graphic, bold — logo family) ─────────────────────────────────
// Defined at (0, 0); positioned via CSS animation.

function Butterfly({ s = 1, fill = SAGE }: { s?: number; fill?: string }) {
  return (
    <g>
      {/* Upper left wing */}
      <path d={`M 0 0 Q ${-22*s} ${-14*s} ${-30*s} ${-1*s} Q ${-20*s} ${9*s} 0 0`}
        fill={fill} opacity="0.65" />
      {/* Lower left wing */}
      <path d={`M 0 0 Q ${-18*s} ${8*s} ${-22*s} ${18*s} Q ${-10*s} ${20*s} 0 0`}
        fill={fill} opacity="0.5" />
      {/* Upper right wing */}
      <path d={`M 0 0 Q ${22*s} ${-14*s} ${30*s} ${-1*s} Q ${20*s} ${9*s} 0 0`}
        fill={fill} opacity="0.65" />
      {/* Lower right wing */}
      <path d={`M 0 0 Q ${18*s} ${8*s} ${22*s} ${18*s} Q ${10*s} ${20*s} 0 0`}
        fill={fill} opacity="0.5" />
      {/* Body */}
      <line x1={0} y1={-9*s} x2={0} y2={11*s} stroke={DARK} strokeWidth={1.5*s} strokeLinecap="round" />
    </g>
  )
}

// ─── Full scene ───────────────────────────────────────────────────────────────

export default function SeasonalHero({ theme }: Props) {
  const { fullBloom, showBuds, showSeedHeads, showButterfly, particle, particleColor } = theme
  const isWinter = theme.season === 'winter'
  const GROUND = 176   // y-coordinate of ground line in 680×210 viewBox

  return (
    <div className="relative overflow-hidden rounded-xl mb-7" style={{ background: '#fff' }}>

      {/* Falling particles (petals, rain, snow) rendered over the SVG scene */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <SeasonalLayer type={particle} color={particleColor} />
      </div>

      <svg
        width="100%"
        viewBox="0 0 680 210"
        preserveAspectRatio="xMidYMax meet"
        style={{ display: 'block' }}
        aria-hidden="true"
      >
        {/* Sky — clean white */}
        <rect width="680" height="210" fill="#fff" />

        {/* ── Clouds ── */}
        <g className="g-cloud-a"><Cloud s={1.05} /></g>
        <g className="g-cloud-b"><Cloud s={0.78} /></g>

        {/* ── Ground line ── */}
        <line x1="0" y1={GROUND} x2="680" y2={GROUND}
          stroke="#e0ddd6" strokeWidth="1" />

        {/* ═══════════════ LEFT CLUSTER ═══════════════ */}

        {/* Flower A — tall, far left */}
        <Stem x1={56} y1={GROUND} x2={50} y2={GROUND - 108} fill={DARK} w={3.5} />
        <Dot  cx={68} cy={GROUND - 12} r={4} fill={DARK} />
        {!isWinter && (showSeedHeads
          ? <SeedHead cx={50} cy={GROUND - 116} r={1.1} fill={DARK} />
          : fullBloom
          ? <Flower   cx={50} cy={GROUND - 116} r={14} fill={DARK} />
          : showBuds
          ? <Bud      cx={50} cy={GROUND - 112} r={10} fill={DARK} />
          : <Flower   cx={50} cy={GROUND - 116} r={12} fill={SAGE} opacity={0.7} />
        )}

        {/* Flower B — medium, second from left, earth color */}
        <Stem x1={104} y1={GROUND} x2={99} y2={GROUND - 72} fill={EARTH} w={2.8} />
        <Dot  cx={113} cy={GROUND - 8} r={3} fill={EARTH} />
        {!isWinter && (showSeedHeads
          ? <SeedHead cx={99} cy={GROUND - 79}  r={0.85} fill={EARTH} />
          : fullBloom
          ? <Flower   cx={99} cy={GROUND - 79}  r={10} fill={EARTH} center="#e8a840" />
          : showBuds
          ? <Bud      cx={99} cy={GROUND - 76}  r={7}  fill={EARTH} />
          : <Flower   cx={99} cy={GROUND - 79}  r={9}  fill={EARTH} center="#e8a840" opacity={0.75} />
        )}

        {/* Flower C — small, sage, third from left */}
        <Stem x1={148} y1={GROUND} x2={144} y2={GROUND - 42} fill={SAGE} w={2.2} />
        {!isWinter && (showSeedHeads
          ? <SeedHead cx={144} cy={GROUND - 48} r={0.65} fill={SAGE} />
          : showBuds || fullBloom
          ? <Flower   cx={144} cy={GROUND - 48} r={7}  fill={SAGE}  center="#d8c840" opacity={0.8} />
          : <Flower   cx={144} cy={GROUND - 48} r={6}  fill={SAGE}  center="#d8c840" opacity={0.6} />
        )}
        <Dot cx={155} cy={GROUND - 4} r={2.5} fill={SAGE} />

        {/* ═══════════════ RIGHT CLUSTER (mirrored) ═══════════════ */}

        {/* Flower D — small, sage */}
        <Stem x1={532} y1={GROUND} x2={536} y2={GROUND - 38} fill={SAGE} w={2.2} />
        {!isWinter && (showSeedHeads
          ? <SeedHead cx={536} cy={GROUND - 44} r={0.65} fill={SAGE} />
          : showBuds || fullBloom
          ? <Flower   cx={536} cy={GROUND - 44} r={6}  fill={SAGE}  center="#d8c840" opacity={0.8} />
          : <Flower   cx={536} cy={GROUND - 44} r={5.5} fill={SAGE} center="#d8c840" opacity={0.6} />
        )}
        <Dot cx={525} cy={GROUND - 5} r={2.5} fill={SAGE} />

        {/* Flower E — medium, earth */}
        <Stem x1={578} y1={GROUND} x2={582} y2={GROUND - 68} fill={EARTH} w={2.8} />
        <Dot  cx={568} cy={GROUND - 10} r={3} fill={EARTH} />
        {!isWinter && (showSeedHeads
          ? <SeedHead cx={582} cy={GROUND - 75} r={0.85} fill={EARTH} />
          : fullBloom
          ? <Flower   cx={582} cy={GROUND - 75} r={10} fill={EARTH} center="#e8a840" />
          : showBuds
          ? <Bud      cx={582} cy={GROUND - 72} r={7}  fill={EARTH} />
          : <Flower   cx={582} cy={GROUND - 75} r={9}  fill={EARTH} center="#e8a840" opacity={0.75} />
        )}

        {/* Flower F — tall, dark, far right — hero anchor */}
        <Stem x1={630} y1={GROUND} x2={636} y2={GROUND - 112} fill={DARK} w={3.5} />
        <Dot  cx={618} cy={GROUND - 14} r={4} fill={DARK} />
        {!isWinter && (showSeedHeads
          ? <SeedHead cx={636} cy={GROUND - 120} r={1.1} fill={DARK} />
          : fullBloom
          ? <Flower   cx={636} cy={GROUND - 120} r={14} fill={DARK} />
          : showBuds
          ? <Bud      cx={636} cy={GROUND - 116} r={10} fill={DARK} />
          : <Flower   cx={636} cy={GROUND - 120} r={12} fill={SAGE} opacity={0.7} />
        )}

        {/* ── Winter: bare stems only, quiet dots ── */}
        {isWinter && (
          <>
            <Dot cx={55}  cy={GROUND - 120} r={2}   fill={DARK} opacity={0.25} />
            <Dot cx={636} cy={GROUND - 124} r={2}   fill={DARK} opacity={0.25} />
          </>
        )}

        {/* ── Butterfly ── */}
        {showButterfly && (
          <g className="g-butterfly">
            <Butterfly s={0.85} fill={SAGE} />
          </g>
        )}

      </svg>
    </div>
  )
}
