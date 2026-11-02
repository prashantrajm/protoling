import { z } from 'zod'
import { deviceIds } from './devices.ts'

/**
 * On-disk formats for `project.json` and `canvas.json`. Validated when read
 * in the browser and again by the dev plugin before anything is written.
 */

export const slugPattern = /^[a-z0-9][a-z0-9-]*$/
export const screenNamePattern = /^[A-Z][A-Za-z0-9]*$/

const slug = z.string().regex(slugPattern, 'lowercase letters, digits and dashes')

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

export const springTokenSchema = z.object({
  type: z.literal('spring'),
  /** Seconds. Time for the animation to visually reach its target. */
  visualDuration: z.number().min(0.01).max(10),
  /** 0 = no overshoot, towards 1 = bouncier, below 0 = overdamped. */
  bounce: z.number().min(-0.95).max(0.95),
})

export const tweenTokenSchema = z.object({
  type: z.literal('tween'),
  /** Seconds. */
  duration: z.number().min(0).max(10),
  ease: z.union([
    z.enum(easeNames),
    z.tuple([z.number(), z.number(), z.number(), z.number()]),
  ]),
})

export const motionTokenSchema = z.discriminatedUnion('type', [
  springTokenSchema,
  tweenTokenSchema,
])

export type SpringToken = z.infer<typeof springTokenSchema>
export type TweenToken = z.infer<typeof tweenTokenSchema>
export type MotionToken = z.infer<typeof motionTokenSchema>
export type MotionTokens = Record<string, MotionToken>

export const variantSchema = z.object({
  id: slug,
  name: z.string().min(1),
  /** Overrides for the screen's motion tokens. Missing keys use the code default. */
  motion: z.record(z.string(), motionTokenSchema).default({}),
})

export type Variant = z.infer<typeof variantSchema>

export const deviceIdSchema = z.enum(deviceIds as [string, ...string[]])

export const frameSchema = z.object({
  id: slug,
  /** File name in `screens/`, without `.tsx`. */
  screen: z.string().regex(screenNamePattern),
  /** Label shown above the frame. Defaults to the screen's own name. */
  name: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  /** Overrides the canvas device. */
  device: deviceIdSchema.optional(),
  statusBar: z.boolean().default(true),
  variants: z.array(variantSchema).default([]),
})

export type Frame = z.infer<typeof frameSchema>

export const connectorAnimations = ['push', 'fade', 'modal', 'none'] as const
export type ConnectorAnimation = (typeof connectorAnimations)[number]

export const connectorSchema = z.object({
  id: slug,
  from: slug,
  to: slug,
  label: z.string().optional(),
  animation: z.enum(connectorAnimations).default('push'),
  transition: motionTokenSchema.default({
    type: 'spring',
    visualDuration: 0.45,
    bounce: 0,
  }),
})

export type Connector = z.infer<typeof connectorSchema>

export const canvasSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    device: deviceIdSchema.default('iphone-17-pro'),
    frames: z.array(frameSchema).default([]),
    connectors: z.array(connectorSchema).default([]),
    /** Frame ids played in the project-page thumbnail. Defaults to the first three. */
    preview: z.array(slug).optional(),
  })
  .superRefine((canvas, ctx) => {
    const ids = new Set<string>()
    for (const [i, frame] of canvas.frames.entries()) {
      if (ids.has(frame.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['frames', i, 'id'],
          message: `Duplicate frame id "${frame.id}"`,
        })
      }
      ids.add(frame.id)
    }
    for (const [i, connector] of canvas.connectors.entries()) {
      for (const end of ['from', 'to'] as const) {
        if (!ids.has(connector[end])) {
          ctx.addIssue({
            code: 'custom',
            path: ['connectors', i, end],
            message: `Unknown frame "${connector[end]}"`,
          })
        }
      }
    }
  })

export type Canvas = z.infer<typeof canvasSchema>

export const projectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export type Project = z.infer<typeof projectSchema>

export function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
}
