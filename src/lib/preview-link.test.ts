import { describe, expect, it } from 'vitest'
import { appPath, previewUrl } from './preview-link'

describe('appPath', () => {
  it.each([
    ['orbit', 'today/detail', '?task=sprint', '/orbit/today/detail?task=sprint'],
    ['orbit', '', '', '/orbit'],
    ['orbit', '/today/', '?v=today:soft-spring', '/orbit/today?v=today:soft-spring'],
  ])('%s + %j + %j → %s', (project, inside, search, expected) => {
    expect(appPath(project, inside, search)).toBe(expected)
  })
})

describe('previewUrl', () => {
  it('uses whatever site Protoling is running on', () => {
    expect(previewUrl('/orbit/today?v=today:soft-spring', 'http://localhost:3000')).toBe(
      'http://localhost:3000/orbit/today?v=today:soft-spring',
    )
    expect(previewUrl('/orbit/today', 'https://orbit-demo.vercel.app')).toBe(
      'https://orbit-demo.vercel.app/orbit/today',
    )
  })
})
