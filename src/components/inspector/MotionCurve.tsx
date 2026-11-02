import {
  anticipate,
  backIn,
  backInOut,
  backOut,
  circIn,
  circInOut,
  circOut,
  cubicBezier,
  easeIn,
  easeInOut,
  easeOut,
} from 'motion'
import { springPhysics, springPosition } from '@/lib/motion/physics'
import type { EaseName, MotionToken } from '@/lib/schema'

const easings: Record<EaseName, (t: number) => number> = {
  linear: (t) => t,
  easeIn,
  easeOut,
  easeInOut,
  circIn,
  circOut,
  circInOut,
  backIn,
  backOut,
  backInOut,
  anticipate,
}

const width = 280
const height = 84
const pad = 8

/**
 * Value over time for a token, drawn from the same maths the prototype runs.
 * The dashed line is the target; anything above it is overshoot.
 */
export function MotionCurve({ token }: { token: MotionToken }) {
  const samples = 120
  let duration: number
  let at: (t: number) => number

  if (token.type === 'spring') {
    const p = springPhysics(token)
    duration = Math.max(p.settleTime, token.visualDuration) * 1.05
    at = (t) => springPosition(p.stiffness, p.damping, t)
  } else {
    duration = Math.max(token.duration, 0.01)
    const ease = Array.isArray(token.ease)
      ? cubicBezier(...token.ease)
      : easings[token.ease]
    at = (t) => ease(Math.min(1, t / duration))
  }

  const points = Array.from({ length: samples + 1 }, (_, i) => {
    const t = (i / samples) * duration
    return [t, at(t)] as const
  })
  const values = points.map(([, v]) => v)
  const min = Math.min(0, ...values)
  const max = Math.max(1, ...values)
  const x = (t: number) => pad + (t / duration) * (width - pad * 2)
  const y = (v: number) => height - pad - ((v - min) / (max - min)) * (height - pad * 2)
  const d = points
    .map(([t, v], i) => `${i === 0 ? 'M' : 'L'}${x(t).toFixed(1)},${y(v).toFixed(1)}`)
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full rounded-md bg-muted/50"
      role="img"
      aria-label={`Curve over ${duration.toFixed(2)} seconds`}
    >
      <line
        x1={pad}
        x2={width - pad}
        y1={y(1)}
        y2={y(1)}
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeDasharray="3 3"
      />
      <path
        d={d}
        fill="none"
        stroke="var(--brand)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <text
        x={width - pad}
        y={height - 2}
        textAnchor="end"
        className="fill-muted-foreground text-[9px]"
      >
        {duration.toFixed(2)}s
      </text>
    </svg>
  )
}
