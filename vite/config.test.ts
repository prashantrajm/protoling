// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { narrowProjectGlobs, resolveShare } from './config'

describe('resolveShare', () => {
  const discovered = ['acme', 'orbit']

  it('defaults to every project and the first one as start', () => {
    expect(resolveShare({}, discovered)).toEqual({ projects: discovered, start: '/acme' })
  })

  it('keeps chosen projects and start', () => {
    expect(
      resolveShare(
        { share: { projects: ['orbit'], start: '/orbit/welcome' } },
        discovered,
      ),
    ).toEqual({ projects: ['orbit'], start: '/orbit/welcome' })
  })

  it('rejects unknown projects', () => {
    expect(() => resolveShare({ share: { projects: ['secret'] } }, discovered)).toThrow(
      /secret/,
    )
  })

  it('rejects a start outside the shared projects', () => {
    expect(() =>
      resolveShare({ share: { projects: ['orbit'], start: '/acme/home' } }, discovered),
    ).toThrow(/share.start/)
    expect(() => resolveShare({ share: { start: 'orbit' } }, discovered)).toThrow(
      /share.start/,
    )
  })
})

describe('narrowProjectGlobs', () => {
  const code = `import.meta.glob('/projects/*/project.json'); import.meta.glob("/projects/*/boards/*.ts")`

  it('narrows to one project', () => {
    expect(narrowProjectGlobs(code, ['orbit'])).toBe(
      `import.meta.glob('/projects/orbit/project.json'); import.meta.glob("/projects/orbit/boards/*.ts")`,
    )
  })

  it('narrows to several projects with a brace pattern', () => {
    expect(narrowProjectGlobs(code, ['a', 'b'])).toContain(
      `'/projects/{a,b}/project.json'`,
    )
  })
})
