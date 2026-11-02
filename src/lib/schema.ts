import { z } from 'zod'
import { deviceIds } from './devices.ts'

export const easeNames = [
  'linear',
  'easeIn',
  'easeOut',
  'easeInOut',
  'circIn',
  'circOut',
  'circInOut',
  'backIn',
  'backOut',
  'backInOut',
  'anticipate',
] as const

export type EaseName = (typeof easeNames)[number]

export interface SpringToken {
  type: 'spring'
  /** Seconds for the animation to visually reach its target. */
  visualDuration: number
  /** 0 = no overshoot, towards 1 = bouncier, below 0 = overdamped. */
  bounce: number
}

export interface TweenToken {
  type: 'tween'
  /** Seconds. */
  duration: number
  ease: EaseName | [number, number, number, number]
}

export type MotionToken = SpringToken | TweenToken
export type MotionTokens = Record<string, MotionToken>

/** projects/<name>/project.json */
export const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  /** Device the app is previewed on unless you pick another. */
  device: z.enum(deviceIds as [string, ...string[]]).default('iphone-17-pro'),
})

export type Project = z.infer<typeof projectSchema>

export function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
}
