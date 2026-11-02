import { describe, expect, it } from 'vitest'
import { resolveNavigation } from './flow'
import { canvasSchema } from './schema'

const canvas = canvasSchema.parse({
  name: 'Test',
  frames: [
    { id: 'home', screen: 'Home', position: { x: 0, y: 0 } },
    { id: 'detail', screen: 'OrderDetail', position: { x: 500, y: 0 } },
    { id: 'profile', screen: 'Profile', position: { x: 1000, y: 0 } },
  ],
  connectors: [{ id: 'a', from: 'home', to: 'detail', animation: 'modal' }],
})

describe('resolveNavigation', () => {
  it('follows the first outgoing connector with no target', () => {
    const result = resolveNavigation(canvas, 'home')
    expect(result?.frame.id).toBe('detail')
    expect(result?.connector?.animation).toBe('modal')
  })

  it('resolves by frame id or screen name', () => {
    expect(resolveNavigation(canvas, 'home', 'detail')?.frame.id).toBe('detail')
    expect(resolveNavigation(canvas, 'home', 'OrderDetail')?.frame.id).toBe('detail')
    expect(resolveNavigation(canvas, 'home', 'orderdetail')?.frame.id).toBe('detail')
  })

  it('allows navigation without a connector', () => {
    const result = resolveNavigation(canvas, 'home', 'profile')
    expect(result?.frame.id).toBe('profile')
    expect(result?.connector).toBeNull()
  })

  it('returns null for unknown targets and dead ends', () => {
    expect(resolveNavigation(canvas, 'home', 'nope')).toBeNull()
    expect(resolveNavigation(canvas, 'profile')).toBeNull()
  })
})
