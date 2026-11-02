import type { Transition } from 'motion/react'
import type { EaseName, MotionToken, SpringToken, TweenToken } from '../schema'

/** `spring(0.4, 0.2)` — visual duration in seconds, bounce from 0 to just under 1. */
export function spring(visualDuration: number, bounce = 0): SpringToken {
  return { type: 'spring', visualDuration, bounce }
}

/** `tween(0.25, 'easeOut')` — duration in seconds, named easing or cubic Bézier. */
export function tween(
  duration: number,
  ease: EaseName | [number, number, number, number] = 'easeOut',
): TweenToken {
  return { type: 'tween', duration, ease }
}

/**
 * Converts a token into a Motion `transition`. `timeScale` > 1 slows the
 * animation down: durations stretch by that factor and spring shape is kept.
 */
export function toTransition(token: MotionToken, timeScale = 1): Transition {
  if (token.type === 'spring') {
    return {
      type: 'spring',
      visualDuration: token.visualDuration * timeScale,
      bounce: token.bounce,
    }
  }
  return {
    type: 'tween',
    duration: token.duration * timeScale,
    ease: token.ease,
  }
}

export function describeToken(token: MotionToken): string {
  if (token.type === 'spring') {
    return `Spring · ${formatSeconds(token.visualDuration)} · bounce ${round(token.bounce, 2)}`
  }
  const ease = Array.isArray(token.ease)
    ? `cubic-bezier(${token.ease.join(', ')})`
    : token.ease
  return `Tween · ${formatSeconds(token.duration)} · ${ease}`
}

export function formatSeconds(seconds: number): string {
  return seconds < 1 ? `${Math.round(seconds * 1000)}ms` : `${round(seconds, 2)}s`
}

export function round(value: number, digits = 3): number {
  const f = 10 ** digits
  return Math.round(value * f) / f
}
