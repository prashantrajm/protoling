import { spring as motionSpring } from 'motion'
import { describe, expect, it } from 'vitest'
import { generateHandoff } from './handoff'
import {
  bounceToDampingRatio,
  easeToBezier,
  springPhysics,
  springPosition,
} from './physics'

/** Sample Motion's own spring generator (time in ms) at the given seconds. */
function motionCurve(options: Record<string, number>, times: number[]): number[] {
  const generator = motionSpring({ keyframes: [0, 1], ...options })
  return times.map((t) => generator.next(t * 1000).value as number)
}

const times = Array.from({ length: 60 }, (_, i) => i * 0.025)

describe('springPhysics', () => {
  it.each([
    [0.3, 0],
    [0.4, 0.2],
    [0.6, 0.35],
    [0.8, 0.6],
    [0.5, -0.3],
  ])('matches Motion for visualDuration %s, bounce %s', (visualDuration, bounce) => {
    const p = springPhysics({ visualDuration, bounce })
    const fromTokens = motionCurve({ visualDuration, bounce }, times)
    const fromPhysics = motionCurve(
      { stiffness: p.stiffness, damping: p.damping, mass: 1 },
      times,
    )
    for (let i = 0; i < times.length; i++) {
      expect(fromPhysics[i]).toBeCloseTo(fromTokens[i], 4)
    }
  })

  it('closed-form position agrees with Motion while the spring is moving', () => {
    const p = springPhysics({ visualDuration: 0.5, bounce: 0.3 })
    const generator = motionSpring({
      keyframes: [0, 1],
      visualDuration: 0.5,
      bounce: 0.3,
    })
    let compared = 0
    for (const t of times) {
      const { value, done } = generator.next(t * 1000)
      // Once at rest Motion snaps to exactly the target, which the closed form never reaches.
      if (done) break
      expect(springPosition(p.stiffness, p.damping, t)).toBeCloseTo(value as number, 3)
      compared++
    }
    expect(compared).toBeGreaterThan(20)
  })

  it('matches SwiftUI .spring(duration:bounce:) for bounce >= 0', () => {
    // SwiftUI: stiffness = (2π / duration)², damping = 4π (1 − bounce) / duration
    const p = springPhysics({ visualDuration: 0.4, bounce: 0.25 })
    const d = p.swiftUIDuration
    expect(p.stiffness).toBeCloseTo(((2 * Math.PI) / d) ** 2, 6)
    expect(p.damping).toBeCloseTo((4 * Math.PI * (1 - 0.25)) / d, 6)
  })

  it('maps bounce to damping ratio like SwiftUI', () => {
    expect(bounceToDampingRatio(0)).toBe(1)
    expect(bounceToDampingRatio(0.3)).toBeCloseTo(0.7)
    expect(bounceToDampingRatio(-0.5)).toBeCloseTo(2)
  })

  it('settles later for bouncier springs', () => {
    const calm = springPhysics({ visualDuration: 0.4, bounce: 0 })
    const bouncy = springPhysics({ visualDuration: 0.4, bounce: 0.6 })
    expect(bouncy.settleTime).toBeGreaterThan(calm.settleTime)
  })
})

describe('easeToBezier', () => {
  it('returns Motion’s exact curves', () => {
    expect(easeToBezier('easeOut')).toEqual({ bezier: [0, 0, 0.58, 1], exact: true })
    expect(easeToBezier([0.2, 0, 0, 1])).toEqual({ bezier: [0.2, 0, 0, 1], exact: true })
  })

  it('flags non-Bézier easings as approximate', () => {
    expect(easeToBezier('circOut').exact).toBe(false)
  })
})

describe('generateHandoff', () => {
  const tokens = {
    enter: { type: 'spring', visualDuration: 0.4, bounce: 0.2 },
    fade: { type: 'tween', duration: 0.25, ease: 'easeOut' },
  } as const

  it('generates SwiftUI', () => {
    const code = generateHandoff('swiftui', tokens, { name: 'Home' })
    expect(code).toContain('enum HomeMotion {')
    expect(code).toContain(
      'static let enter = Animation.spring(duration: 0.48, bounce: 0.2)',
    )
    expect(code).toContain('Animation.timingCurve(0, 0, 0.58, 1, duration: 0.25)')
  })

  it('generates Compose', () => {
    const code = generateHandoff('compose', tokens, { name: 'Home' })
    expect(code).toContain('object HomeMotion {')
    expect(code).toContain('spring(dampingRatio = 0.8f, stiffness = 171.35f)')
    expect(code).toContain(
      'tween(durationMillis = 250, easing = CubicBezierEasing(0.0f, 0.0f, 0.58f, 1.0f))',
    )
  })

  it('generates Motion', () => {
    const code = generateHandoff('motion', tokens, {
      name: 'Home',
      variant: 'Soft spring',
    })
    expect(code).toContain('// Home · Soft spring')
    expect(code).toContain("enter: { type: 'spring', visualDuration: 0.4, bounce: 0.2 },")
  })
})
