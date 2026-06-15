import { detectSeason, type Season } from '../lib/seasonTheme'

// ─── Palette ──────────────────────────────────────────────────────────────────

type Pal = { petal: string; stroke: string; center: string }

const PALETTES: Record<Season, [Pal, Pal, Pal]> = {
  spring: [
    { petal: 'rgba(232,208,222,0.68)', stroke: '#c0a0b4', center: '#d8b0a8' },
    { petal: 'rgba(210,220,242,0.62)', stroke: '#9aa8c4', center: '#b0c0d8' },
    { petal: 'rgba(228,220,244,0.62)', stroke: '#b0a8ce', center: '#c8b8d8' },
  ],
  summer: [
    { petal: 'rgba(244,238,210,0.72)', stroke: '#c0b078', center: '#d4a860' },
    { petal: 'rgba(240,218,202,0.68)', stroke: '#c4a07a', center: '#d8b080' },
    { petal: 'rgba(218,234,210,0.62)', stroke: '#8ea872', center: '#a8c090' },
  ],
  autumn: [
    { petal: 'rgba(234,214,184,0.68)', stroke: '#b89060', center: '#c8a038' },
    { petal: 'rgba(220,200,174,0.62)', stroke: '#a88054', center: '#b89048' },
    { petal: 'rgba(232,224,198,0.62)', stroke: '#b0a468', center: '#c0b050' },
  ],
  rainy: [
    { petal: 'rgba(218,228,240,0.60)', stroke: '#8898b4', center: '#a8b8cc' },
    { petal: 'rgba(210,225,225,0.55)', stroke: '#7898a0', center: '#98b4b8' },
    { petal: 'rgba(225,220,238,0.58)', stroke: '#9890b8', center: '#b0a8cc' },
  ],
  winter: [
    { petal: 'rgba(208,218,234,0.55)', stroke: '#8898b4', center: '#a0acc0' },
    { petal: 'rgba(218,215,226,0.50)', stroke: '#a0a0b2', center: '#b0a8bc' },
    { petal: 'rgba(214,224,228,0.50)', stroke: '#90a0aa', center: '#9eb0b8' },
  ],
}

const STEM_STROKE  = '#8a9870'
const LEAF_FILL    = 'rgba(184,202,168,0.46)'
const LEAF_STROKE  = '#7a9268'
const SEED_COLOR   = '#a89060'

// ─── Helpers (all geometry in floating-point, rounded for output) ─────────────

const r2 = (n: number) => Math.round(n * 100) / 100

// ─── Petal — organic bezier tear-drop ────────────────────────────────────────

function Petal({
  cx, cy, angle, len, w, fill, stroke,
}: { cx: number; cy: number; angle: number; len: number; w: number; fill: string; stroke: string }) {
  const a   = (angle * Math.PI) / 180
  const pa  = a + Math.PI / 2
  const hw  = w / 2

  const tx = cx + Math.cos(a) * len
  const ty = cy + Math.sin(a) * len

  const b1x = cx + Math.cos(pa) * hw,  b1y = cy + Math.sin(pa) * hw
  const b2x = cx - Math.cos(pa) * hw,  b2y = cy - Math.sin(pa) * hw

  const c1x = b1x + Math.cos(a) * len * 0.55 + Math.cos(pa) * hw * 0.5
  const c1y = b1y + Math.sin(a) * len * 0.55 + Math.sin(pa) * hw * 0.5
  const c2x = tx  + Math.cos(pa) * hw * 0.25, c2y = ty + Math.sin(pa) * hw * 0.25
  const c3x = tx  - Math.cos(pa) * hw * 0.25, c3y = ty - Math.sin(pa) * hw * 0.25
  const c4x = b2x + Math.cos(a) * len * 0.55 - Math.cos(pa) * hw * 0.5
  const c4y = b2y + Math.sin(a) * len * 0.55 - Math.sin(pa) * hw * 0.5

  return (
    <path
      d={`M ${r2(b1x)} ${r2(b1y)} C ${r2(c1x)} ${r2(c1y)} ${r2(c2x)} ${r2(c2y)} ${r2(tx)} ${r2(ty)} C ${r2(c3x)} ${r2(c3y)} ${r2(c4x)} ${r2(c4y)} ${r2(b2x)} ${r2(b2y)} Z`}
      fill={fill}
      stroke={stroke}
      strokeWidth="0.65"
      strokeLinejoin="round"
    />
  )
}

// ─── Full 5-petal flower ──────────────────────────────────────────────────────

// Slight per-petal size variation so petals look hand-drawn, not mechanical.
const PETAL_VAR = [1, 0.94, 1.03, 0.97, 1.01]

function Flower5({ cx, cy, r = 11, pal }: { cx: number; cy: number; r?: number; pal: Pal }) {
  return (
    <g>
      {Array.from({ length: 5 }, (_, i) => (
        <Petal
          key={i}
          cx={cx} cy={cy}
          angle={i * 72 - 90}
          len={r * 1.18 * PETAL_VAR[i]}
          w={r * 0.56 * PETAL_VAR[(i + 2) % 5]}
          fill={pal.petal}
          stroke={pal.stroke}
        />
      ))}
      <circle cx={cx} cy={cy} r={r * 0.42} fill={pal.center} />
    </g>
  )
}

// ─── Bud — 3 petals barely opening (spring) ──────────────────────────────────

function Bud({ cx, cy, r = 8, pal }: { cx: number; cy: number; r?: number; pal: Pal }) {
  return (
    <g>
      <Petal cx={cx} cy={cy} angle={-100} len={r}        w={r * 0.42} fill={pal.petal} stroke={pal.stroke} />
      <Petal cx={cx} cy={cy} angle={-80}  len={r * 0.95} w={r * 0.38} fill={pal.petal} stroke={pal.stroke} />
      <Petal cx={cx} cy={cy} angle={-90}  len={r * 1.1}  w={r * 0.35} fill={pal.petal} stroke={pal.stroke} />
      <circle cx={cx} cy={cy} r={r * 0.3} fill={pal.center} opacity="0.8" />
    </g>
  )
}

// ─── Seed head — autumn dried flower ─────────────────────────────────────────

function SeedHead({ cx, cy, r = 1 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      {Array.from({ length: 9 }, (_, i) => {
        const a = ((i * 40) - 10) * (Math.PI / 180)
        const inner = 5 * r, outer = 13 * r
        const ox = cx + Math.cos(a) * outer
        const oy = cy + Math.sin(a) * outer
        return (
          <g key={i}>
            <line
              x1={r2(cx + Math.cos(a) * inner)} y1={r2(cy + Math.sin(a) * inner)}
              x2={r2(ox)} y2={r2(oy)}
              stroke={SEED_COLOR} strokeWidth="0.65" strokeLinecap="round"
            />
            <circle cx={r2(ox)} cy={r2(oy)} r={1.4 * r} fill={SEED_COLOR} opacity="0.65" />
          </g>
        )
      })}
    </g>
  )
}

// ─── Stem — slight quadratic curve ───────────────────────────────────────────

function Stem({ x1, y1, x2, y2, bend = 0, w = 0.9 }: {
  x1: number; y1: number; x2: number; y2: number; bend?: number; w?: number
}) {
  const mx = r2((x1 + x2) / 2 + bend)
  const my = r2((y1 + y2) / 2)
  return (
    <path
      d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
      stroke={STEM_STROKE}
      strokeWidth={w}
      strokeLinecap="round"
      fill="none"
    />
  )
}

// ─── Leaf — organic ellipse branching from stem ───────────────────────────────

function Leaf({ x, y, dir = 1, size = 1 }: { x: number; y: number; dir?: 1 | -1; size?: number }) {
  const len = 16 * size
  const hw  = 5.5 * size
  // dir=1 → right leaf (upper-right angle), dir=-1 → left leaf (upper-left)
  const a  = (dir > 0 ? -50 : -130) * (Math.PI / 180)
  const pa = a + Math.PI / 2

  const tx = x + Math.cos(a) * len
  const ty = y + Math.sin(a) * len

  const c1x = x  + Math.cos(a) * len * 0.32 + Math.cos(pa) * hw
  const c1y = y  + Math.sin(a) * len * 0.32 + Math.sin(pa) * hw
  const c2x = tx + Math.cos(pa) * hw * 0.2,  c2y = ty + Math.sin(pa) * hw * 0.2
  const c3x = tx - Math.cos(pa) * hw * 0.2,  c3y = ty - Math.sin(pa) * hw * 0.2
  const c4x = x  + Math.cos(a) * len * 0.32 - Math.cos(pa) * hw
  const c4y = y  + Math.sin(a) * len * 0.32 - Math.sin(pa) * hw

  return (
    <path
      d={`M ${x} ${y} C ${r2(c1x)} ${r2(c1y)} ${r2(c2x)} ${r2(c2y)} ${r2(tx)} ${r2(ty)} C ${r2(c3x)} ${r2(c3y)} ${r2(c4x)} ${r2(c4y)} ${x} ${y} Z`}
      fill={LEAF_FILL}
      stroke={LEAF_STROKE}
      strokeWidth="0.6"
    />
  )
}

// ─── Grass — tiny simple stems at ground ─────────────────────────────────────

function Grass({ x, y, h, lean = 0 }: { x: number; y: number; h: number; lean?: number }) {
  return (
    <path
      d={`M ${x} ${y} Q ${x + lean} ${y - h * 0.55} ${x + lean * 1.4} ${y - h}`}
      stroke={STEM_STROKE}
      strokeWidth="0.7"
      strokeLinecap="round"
      fill="none"
      opacity="0.6"
    />
  )
}

// ─── Season-aware flower head ─────────────────────────────────────────────────

function FlowerHead({ cx, cy, season, pal, r = 11 }: {
  cx: number; cy: number; season: Season; pal: Pal; r?: number
}) {
  if (season === 'winter')
    return <circle cx={cx} cy={cy} r={2} fill={STEM_STROKE} opacity="0.45" />
  if (season === 'autumn')
    return <SeedHead cx={cx} cy={cy} r={r * 0.075} />
  if (season === 'spring')
    return <Bud cx={cx} cy={cy} r={r * 0.78} pal={pal} />
  // summer + rainy
  return <Flower5 cx={cx} cy={cy} r={r} pal={pal} />
}

// ─── Left sidebar garden ──────────────────────────────────────────────────────

export function GardenSidebarLeft() {
  const season = detectSeason()
  const pal    = PALETTES[season]
  const G      = 258  // ground y

  return (
    <svg
      width="100%"
      viewBox="0 0 192 264"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Ground grass */}
      <Grass x={22}  y={G} h={28} lean={-2} />
      <Grass x={58}  y={G} h={22} lean={3}  />
      <Grass x={110} y={G} h={26} lean={-3} />
      <Grass x={165} y={G} h={20} lean={2}  />
      <Grass x={180} y={G} h={30} lean={-1} />

      {/* Flower C — shorter, right */}
      <Stem x1={148} y1={G} x2={152} y2={G - 88}  bend={5}  />
      <Leaf  x={148}  y={G - 42}  dir={1}  size={0.85} />
      <FlowerHead cx={152} cy={G - 96}  season={season} pal={pal[2]} r={9}  />

      {/* Flower B — medium, center */}
      <Stem x1={90}  y1={G} x2={87}  y2={G - 130} bend={-4} />
      <Leaf  x={90}   y={G - 55}  dir={-1} size={0.9}  />
      <Leaf  x={89}   y={G - 92}  dir={1}  size={0.8}  />
      <FlowerHead cx={87}  cy={G - 140} season={season} pal={pal[1]} r={10} />

      {/* Flower A — tallest, left */}
      <Stem x1={34}  y1={G} x2={30}  y2={G - 178} bend={-5} />
      <Leaf  x={34}   y={G - 72}  dir={-1}         />
      <Leaf  x={32}   y={G - 122} dir={1}  size={0.9} />
      <FlowerHead cx={30}  cy={G - 187} season={season} pal={pal[0]} r={12} />
    </svg>
  )
}

// ─── Right sidebar garden ─────────────────────────────────────────────────────

export function GardenSidebarRight() {
  const season = detectSeason()
  const pal    = PALETTES[season]
  const G      = 258

  return (
    <svg
      width="100%"
      viewBox="0 0 192 264"
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden="true"
    >
      {/* Ground grass */}
      <Grass x={14}  y={G} h={24} lean={2}  />
      <Grass x={50}  y={G} h={30} lean={-2} />
      <Grass x={90}  y={G} h={22} lean={3}  />
      <Grass x={140} y={G} h={27} lean={-1} />
      <Grass x={172} y={G} h={20} lean={2}  />

      {/* Flower C — shorter, left */}
      <Stem x1={42}  y1={G} x2={39}  y2={G - 84}  bend={-4} />
      <Leaf  x={42}   y={G - 38}  dir={-1} size={0.85} />
      <FlowerHead cx={39}  cy={G - 93}  season={season} pal={pal[2]} r={8.5} />

      {/* Flower B — medium, center-right */}
      <Stem x1={104} y1={G} x2={108} y2={G - 122} bend={4}  />
      <Leaf  x={104}  y={G - 50}  dir={1}  size={0.9}  />
      <Leaf  x={106}  y={G - 88}  dir={-1} size={0.8}  />
      <FlowerHead cx={108} cy={G - 132} season={season} pal={pal[1]} r={9.5} />

      {/* Flower A — tallest, right */}
      <Stem x1={162} y1={G} x2={166} y2={G - 172} bend={5}  />
      <Leaf  x={162}  y={G - 68}  dir={1}           />
      <Leaf  x={164}  y={G - 118} dir={-1} size={0.9} />
      <FlowerHead cx={166} cy={G - 181} season={season} pal={pal[0]} r={12} />
    </svg>
  )
}
