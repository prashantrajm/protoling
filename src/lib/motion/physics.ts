import type { EaseName, SpringToken } from '../schema'

/**
 * Spring maths, ported from Motion's spring generator
 * (motion-dom/src/animation/generators/spring.ts) so the handoff values are
 * exactly what the prototype ran. Tests compare our physics against Motion's
 * own generator.
 */

const minDamping = 0.05

/** Same mapping Motion and SwiftUI use: 0 = critical, → 1 underdamped, → −1 overdamped. */
export function bounceToDampingRatio(bounce: number): number {
  return bounce < 0
    ? 1 / Math.max(1 + bounce, minDamping)
    : Math.max(1 - bounce, minDamping)
}

function approximateRoot(
  envelope: (x: number) => number,
  derivative: (x: number) => number,
  initialGuess: number,
): number {
  let result = initialGuess
  for (let i = 1; i < 12; i++) result -= envelope(result) / derivative(result)
  return result
}

/** Motion's overdamped frequency correction. Returns 1 for bounce ≥ 0. */
function overdampedFreqScale(dampingRatio: number, criticalFreqTime: number): number {
  if (!(dampingRatio > 1)) return 1
  const root = Math.sqrt(dampingRatio * dampingRatio - 1)
  const slow = dampingRatio - root
  const fast = dampingRatio + root
  const target = 2 * root * Math.exp(-criticalFreqTime) * (1 + criticalFreqTime)
  return (
    approximateRoot(
      (t) => fast * Math.exp(-slow * t) - slow * Math.exp(-fast * t) - target,
      (t) => Math.exp(-fast * t) - Math.exp(-slow * t),
      criticalFreqTime,
    ) / criticalFreqTime
  )
}

export interface SpringPhysics {
  mass: 1
  stiffness: number
  damping: number
  dampingRatio: number
  /**
   * SwiftUI `.spring(duration:bounce:)` duration. SwiftUI defines stiffness as
   * (2π / duration)², Motion as (2π / (1.2 × visualDuration))², so the two
   * agree when duration = 1.2 × visualDuration. Only exact for bounce ≥ 0;
   * Motion rescales overdamped springs, SwiftUI doesn't.
   */
  swiftUIDuration: number
  /** Seconds until within 0.1% of the target and nearly still. */
  settleTime: number
}

export function springPhysics({
  visualDuration,
  bounce,
}: Omit<SpringToken, 'type'>): SpringPhysics {
  const dampingRatio = bounceToDampingRatio(bounce)
  const base = (2 * Math.PI) / (visualDuration * 1.2)
  const root = base * overdampedFreqScale(dampingRatio, (2 * Math.PI) / 1.2)
  const stiffness = root * root
  const damping = 2 * dampingRatio * Math.sqrt(stiffness)
  return {
    mass: 1,
    stiffness,
    damping,
    dampingRatio,
    swiftUIDuration: visualDuration * 1.2,
    settleTime: settleTime(stiffness, damping),
  }
}

/** Position of a unit spring (0 → 1, mass 1, at rest) at time t in seconds. */
export function springPosition(stiffness: number, damping: number, t: number): number {
  const w0 = Math.sqrt(stiffness)
  const zeta = damping / (2 * w0)
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta)
    const envelope = Math.exp(-zeta * w0 * t)
    return 1 - envelope * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t))
  }
  if (zeta === 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t)
  const r = w0 * Math.sqrt(zeta * zeta - 1)
  const s1 = -zeta * w0 + r
  const s2 = -zeta * w0 - r
  // x(t) = 1 + A e^{s1 t} + B e^{s2 t}, x(0) = 0, x'(0) = 0
  const a = s2 / (s1 - s2)
  const b = -s1 / (s1 - s2)
  return 1 + a * Math.exp(s1 * t) + b * Math.exp(s2 * t)
}

function settleTime(stiffness: number, damping: number): number {
  const step = 1 / 240
  let lastOutside = 0
  for (let t = 0; t <= 10; t += step) {
    if (Math.abs(1 - springPosition(stiffness, damping, t)) > 0.001) lastOutside = t
  }
  return Math.min(10, lastOutside + step)
}

export type Bezier = [number, number, number, number]

/**
 * Cubic Bézier for an easing, plus whether it's exact. Motion's circ, backInOut
 * and anticipate easings are not Béziers; those get the closest common curve
 * and the handoff panel flags them as approximate.
 */
export function easeToBezier(ease: EaseName | Bezier): {
  bezier: Bezier
  exact: boolean
} {
  if (Array.isArray(ease)) return { bezier: ease, exact: true }
  const exact: Partial<Record<EaseName, Bezier>> = {
    linear: [0, 0, 1, 1],
    easeIn: [0.42, 0, 1, 1],
    easeOut: [0, 0, 0.58, 1],
    easeInOut: [0.42, 0, 0.58, 1],
    backOut: [0.33, 1.53, 0.69, 0.99],
    // Motion defines backIn as backOut reversed: (1-x2, 1-y2, 1-x1, 1-y1).
    backIn: [0.31, 0.01, 0.67, -0.53],
  }
  const approximate: Partial<Record<EaseName, Bezier>> = {
    circIn: [0.6, 0.04, 0.98, 0.335],
    circOut: [0.075, 0.82, 0.165, 1],
    circInOut: [0.785, 0.135, 0.15, 0.86],
    backInOut: [0.68, -0.6, 0.32, 1.6],
    anticipate: [0.36, -0.45, 0.3, 1],
  }
  const hit = exact[ease]
  if (hit) return { bezier: hit, exact: true }
  return { bezier: approximate[ease] ?? [0.42, 0, 0.58, 1], exact: false }
}
