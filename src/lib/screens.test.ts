import { describe, expect, it } from 'vitest'
import { deriveArrows } from './screens'

const screens = new Map([
  ['/a/today', { presenter: null, presentation: undefined }],
  ['/a/today/detail', { presenter: '/a/today', presentation: 'push' }],
  ['/a/today/detail/move', { presenter: '/a/today/detail', presentation: 'sheet' }],
  ['/a/me', { presenter: null, presentation: undefined }],
])

describe('deriveArrows', () => {
  it('links each presented screen to its presenter', () => {
    const arrows = deriveArrows(
      [
        { id: '1', routeId: '/a/today' },
        { id: '2', routeId: '/a/today/detail' },
        { id: '3', routeId: '/a/today/detail/move' },
        { id: '4', routeId: '/a/me' },
      ],
      screens,
    )
    expect(arrows.map((a) => `${a.from}->${a.to}:${a.presentation}`)).toEqual([
      '1->2:push',
      '2->3:sheet',
    ])
  })

  it('uses the nearest earlier presenter when a screen appears as several variants', () => {
    const arrows = deriveArrows(
      [
        { id: 'today-default', routeId: '/a/today' },
        { id: 'today-soft', routeId: '/a/today' },
        { id: 'detail', routeId: '/a/today/detail' },
      ],
      screens,
    )
    expect(arrows.map((a) => a.from)).toEqual(['today-soft'])
  })

  it('draws nothing without the presenter on the board', () => {
    expect(deriveArrows([{ id: '2', routeId: '/a/today/detail' }], screens)).toEqual([])
  })
})
