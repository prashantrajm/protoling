import { describe, expect, it } from 'vitest'
import { parseVariants, screenKey, serializeVariants, withVariant } from './variant-param'

describe('variant URL param', () => {
  it('round-trips', () => {
    const value = 'today:soft-spring,today/detail:quick-fade'
    expect(parseVariants(value)).toEqual({
      today: 'soft-spring',
      'today/detail': 'quick-fade',
    })
    expect(serializeVariants(parseVariants(value))).toBe(value)
  })

  it('ignores junk and drops defaults', () => {
    expect(parseVariants('nope,:x,y:,a:b')).toEqual({ a: 'b' })
    expect(parseVariants(undefined)).toEqual({})
    expect(serializeVariants({ a: 'default' })).toBeUndefined()
  })

  it('sets one screen without touching others', () => {
    expect(withVariant('me:compact', 'today', 'soft-spring')).toBe(
      'me:compact,today:soft-spring',
    )
    expect(withVariant('today:soft-spring', 'today', 'default')).toBeUndefined()
  })
})

describe('screenKey', () => {
  it.each([
    ['/orbit/today/detail', 'today/detail'],
    ['/orbit/', 'index'],
    ['/orbit', 'index'],
    ['/orbital/x', 'orbital/x'],
  ])('%s → %s', (path, key) => {
    expect(screenKey(path, 'orbit')).toBe(key)
  })
})
