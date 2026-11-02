import type { MotionToken, MotionTokens } from '../schema'
import { easeToBezier, springPhysics } from './physics'
import { describeToken, round } from './tokens'

/**
 * Turns motion tokens into code for each platform. Values are computed from
 * the same physics the prototype runs (see physics.ts), not re-typed by hand.
 */

export type HandoffTarget = 'motion' | 'swiftui' | 'compose'

export const handoffTargets: {
  id: HandoffTarget
  label: string
  lang: 'tsx' | 'swift' | 'kotlin'
}[] = [
  { id: 'motion', label: 'Motion', lang: 'tsx' },
  { id: 'swiftui', label: 'SwiftUI', lang: 'swift' },
  { id: 'compose', label: 'Compose', lang: 'kotlin' },
]

export interface HandoffOptions {
  /** Used for the generated type or object name, e.g. "Home" → `HomeMotion`. */
  name: string
  /** Variant name for the header comment. */
  variant?: string
}

export function generateHandoff(
  target: HandoffTarget,
  tokens: MotionTokens,
  options: HandoffOptions,
): string {
  const entries = Object.entries(tokens)
  const typeName = `${pascal(options.name)}Motion`
  const header = options.variant ? `${options.name} · ${options.variant}` : options.name
  switch (target) {
    case 'motion':
      return motionCode(entries, typeName, header)
    case 'swiftui':
      return swiftUICode(entries, typeName, header)
    case 'compose':
      return composeCode(entries, typeName, header)
  }
}

function motionCode(
  entries: [string, MotionToken][],
  typeName: string,
  header: string,
): string {
  const lines = entries.map(([key, token]) => {
    const value =
      token.type === 'spring'
        ? `{ type: 'spring', visualDuration: ${num(token.visualDuration)}, bounce: ${num(token.bounce)} }`
        : `{ duration: ${num(token.duration)}, ease: ${
            Array.isArray(token.ease)
              ? `[${token.ease.map(num).join(', ')}]`
              : `'${token.ease}'`
          } }`
    return `  ${identifier(key)}: ${value},`
  })
  return [
    `// ${header}`,
    `import type { Transition } from 'motion/react'`,
    '',
    `export const ${camel(typeName)} = {`,
    ...lines,
    `} satisfies Record<string, Transition>`,
  ].join('\n')
}

function swiftUICode(
  entries: [string, MotionToken][],
  typeName: string,
  header: string,
): string {
  const lines = entries.flatMap(([key, token]) => {
    const doc = `    /// ${describeToken(token)}`
    if (token.type === 'spring') {
      const p = springPhysics(token)
      if (token.bounce >= 0) {
        return [
          doc,
          `    static let ${identifier(key)} = Animation.spring(duration: ${num(p.swiftUIDuration)}, bounce: ${num(token.bounce)})`,
        ]
      }
      return [
        doc,
        '    /// Overdamped: exact physics, since SwiftUI and Motion shape negative bounce differently.',
        `    static let ${identifier(key)} = Animation.interpolatingSpring(mass: 1, stiffness: ${num(p.stiffness, 2)}, damping: ${num(p.damping, 2)})`,
      ]
    }
    const { bezier, exact } = easeToBezier(token.ease)
    return [
      doc,
      ...(exact ? [] : [`    /// Approximation: "${token.ease}" isn't a cubic Bézier.`]),
      `    static let ${identifier(key)} = Animation.timingCurve(${bezier.map((n) => num(n)).join(', ')}, duration: ${num(token.duration)})`,
    ]
  })
  return [`// ${header}`, 'import SwiftUI', '', `enum ${typeName} {`, ...lines, '}'].join(
    '\n',
  )
}

function composeCode(
  entries: [string, MotionToken][],
  typeName: string,
  header: string,
): string {
  const lines = entries.flatMap(([key, token]) => {
    const doc = `    /** ${describeToken(token)} */`
    if (token.type === 'spring') {
      const p = springPhysics(token)
      return [
        doc,
        `    fun <T> ${identifier(key)}(): SpringSpec<T> = spring(dampingRatio = ${float(p.dampingRatio)}, stiffness = ${float(p.stiffness, 2)})`,
      ]
    }
    const { bezier, exact } = easeToBezier(token.ease)
    return [
      doc,
      ...(exact ? [] : [`    // Approximation: "${token.ease}" isn't a cubic Bézier.`]),
      `    fun <T> ${identifier(key)}(): TweenSpec<T> = tween(durationMillis = ${Math.round(token.duration * 1000)}, easing = CubicBezierEasing(${bezier.map((n) => float(n)).join(', ')}))`,
    ]
  })
  return [
    `// ${header}`,
    'import androidx.compose.animation.core.*',
    '',
    `object ${typeName} {`,
    ...lines,
    '}',
  ].join('\n')
}

/** Human-readable values for the inspector's table. */
export function tokenValues(token: MotionToken): { label: string; value: string }[] {
  if (token.type === 'spring') {
    const p = springPhysics(token)
    return [
      { label: 'Visual duration', value: `${num(token.visualDuration)}s` },
      { label: 'Bounce', value: num(token.bounce) },
      { label: 'Stiffness', value: num(p.stiffness, 2) },
      { label: 'Damping', value: num(p.damping, 2) },
      { label: 'Damping ratio', value: num(p.dampingRatio) },
      { label: 'Mass', value: '1' },
      { label: 'Settles in', value: `${num(p.settleTime, 2)}s` },
    ]
  }
  const { bezier, exact } = easeToBezier(token.ease)
  return [
    { label: 'Duration', value: `${num(token.duration)}s` },
    { label: 'Easing', value: Array.isArray(token.ease) ? 'Custom' : token.ease },
    {
      label: exact ? 'Cubic Bézier' : 'Cubic Bézier (approx.)',
      value: bezier.map((n) => num(n)).join(', '),
    },
  ]
}

function num(value: number, digits = 3): string {
  return String(round(value, digits))
}

function float(value: number, digits = 3): string {
  const s = num(value, digits)
  return `${s.includes('.') ? s : `${s}.0`}f`
}

function identifier(key: string): string {
  const cleaned = camel(key)
  return /^[0-9]/.test(cleaned) ? `_${cleaned}` : cleaned || 'animation'
}

function camel(value: string): string {
  const p = pascal(value)
  return p.charAt(0).toLowerCase() + p.slice(1)
}

function pascal(value: string): string {
  return value
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}
