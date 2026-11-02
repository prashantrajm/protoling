import { describe, expect, it } from 'vitest'
import { timeAgo } from './time'

describe('timeAgo', () => {
  const now = Date.parse('2026-11-02T12:00:00Z')
  it.each([
    ['2026-11-02T11:59:30Z', 'just now'],
    ['2026-11-02T10:00:00Z', '2 hours ago'],
    ['2026-11-01T12:00:00Z', 'yesterday'],
    ['2026-10-19T12:00:00Z', '2 weeks ago'],
  ])('%s → %s', (iso, expected) => {
    expect(timeAgo(iso, now)).toBe(expected)
  })
})
