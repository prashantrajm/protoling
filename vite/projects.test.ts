// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { discoverProjects } from './projects'

let root: string
function project(name: string, withApp = true) {
  mkdirSync(path.join(root, 'projects', name, 'app'), { recursive: true })
  if (withApp) writeFileSync(path.join(root, 'projects', name, 'app', 'route.tsx'), '')
}

afterEach(() => rmSync(root, { recursive: true, force: true }))

describe('discoverProjects', () => {
  it('finds projects with app/route.tsx, sorted', () => {
    root = mkdtempSync(path.join(tmpdir(), 'sb-'))
    project('orbit')
    project('alpha')
    project('draft', false)
    expect(discoverProjects(root)).toEqual(['alpha', 'orbit'])
  })

  it('rejects names reserved by Springboard', () => {
    root = mkdtempSync(path.join(tmpdir(), 'sb-'))
    project('p')
    expect(() => discoverProjects(root)).toThrow(/reserved/)
  })

  it('rejects names that are not slugs', () => {
    root = mkdtempSync(path.join(tmpdir(), 'sb-'))
    project('My App')
    expect(() => discoverProjects(root)).toThrow(/lowercase/)
  })
})
