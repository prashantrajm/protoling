import type { DefinedScreen } from '@/runtime/screen'
import type { Frame, MotionToken, MotionTokens } from './schema'

export interface VariantOption {
  id: string
  name: string
  index: number
  /** Where the variant is defined. */
  source: 'default' | 'code' | 'canvas'
  motion: Partial<MotionTokens>
}

/**
 * Variant 01 is always the screen's own defaults. Then come variants written
 * in the screen file (`defineScreen({ variants })`), then any saved in the
 * frame's canvas.json entry. A canvas.json variant with the same id as a code
 * variant replaces it.
 */
export function frameVariants(
  frame: Frame,
  screen?: DefinedScreen | null,
): VariantOption[] {
  const list: Omit<VariantOption, 'index'>[] = [
    { id: 'default', name: 'Default', source: 'default', motion: {} },
  ]
  for (const [id, variant] of Object.entries(screen?.variants ?? {})) {
    list.push({ id, name: variant.name, source: 'code', motion: variant.motion ?? {} })
  }
  for (const variant of frame.variants) {
    const entry = {
      id: variant.id,
      name: variant.name,
      source: 'canvas' as const,
      motion: variant.motion,
    }
    const existing = list.findIndex((v) => v.id === variant.id)
    if (existing > 0) list[existing] = entry
    else list.push(entry)
  }
  return list.map((v, index) => ({ ...v, index }))
}

export function resolveVariant(
  frame: Frame,
  screen: DefinedScreen | null | undefined,
  id: string | undefined,
): VariantOption {
  const options = frameVariants(frame, screen)
  return options.find((v) => v.id === id) ?? options[0]
}

/** Code defaults with the variant's overrides applied. */
export function resolveTokens(
  defaults: MotionTokens,
  variant: VariantOption,
): MotionTokens {
  const result: MotionTokens = { ...defaults }
  for (const [key, token] of Object.entries(variant.motion)) {
    if (token) result[key] = token as MotionToken
  }
  return result
}

/** "OrderDetail" → "Order detail" */
export function humanize(screenName: string): string {
  const spaced = screenName.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase()
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export function frameLabel(frame: Frame): string {
  return frame.name ?? humanize(frame.screen)
}

export function padIndex(index: number): string {
  return String(index + 1).padStart(2, '0')
}
