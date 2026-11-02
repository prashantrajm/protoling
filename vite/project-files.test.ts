// @vitest-environment node
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  canvasPath,
  canvasTimestamps,
  createCanvas,
  createProject,
  createScreen,
  readCanvas,
  saveCanvas,
} from './project-files'

let root: string

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'springboard-'))
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

async function scaffold() {
  await createProject(root, { slug: 'orbit', name: 'Orbit' })
  await createCanvas(root, { project: 'orbit', slug: 'home', name: 'Home' })
}

describe('path safety', () => {
  it.each(['..', '../etc', 'Orbit', 'a/b', '', '.hidden'])(
    'rejects project slug %j',
    (slug) => {
      expect(() => canvasPath(root, slug, 'home')).toThrow(/lowercase/)
    },
  )

  it('rejects screen names that could escape the folder', async () => {
    await scaffold()
    await expect(
      createScreen(root, { project: 'orbit', canvas: 'home', name: '../../Evil' }),
    ).rejects.toThrow(/PascalCase/)
  })
})

describe('create and save', () => {
  it('creates a project and canvas with valid JSON', async () => {
    await scaffold()
    const project = JSON.parse(
      await readFile(path.join(root, 'projects/orbit/project.json'), 'utf8'),
    )
    expect(project).toEqual({ name: 'Orbit' })
    const canvas = await readCanvas(root, 'orbit', 'home')
    expect(canvas.frames).toEqual([])
  })

  it('refuses to overwrite an existing project', async () => {
    await scaffold()
    await expect(createProject(root, { slug: 'orbit', name: 'Again' })).rejects.toThrow(
      /exists/,
    )
  })

  it('creates a screen file and a frame for it', async () => {
    await scaffold()
    const first = await createScreen(root, {
      project: 'orbit',
      canvas: 'home',
      name: 'OrderDetail',
    })
    const second = await createScreen(root, {
      project: 'orbit',
      canvas: 'home',
      name: 'Profile',
    })
    expect(first.frameId).toBe('order-detail')
    const source = await readFile(
      path.join(root, 'projects/orbit/canvases/home/screens/OrderDetail.tsx'),
      'utf8',
    )
    expect(source).toContain("name: 'OrderDetail'")
    const canvas = await readCanvas(root, 'orbit', 'home')
    expect(canvas.frames.map((f) => f.id)).toEqual(['order-detail', second.frameId])
    expect(canvas.frames[1].position.x).toBeGreaterThan(canvas.frames[0].position.x)
  })

  it('validates canvas data before writing', async () => {
    await scaffold()
    const bad = {
      name: 'Home',
      frames: [{ id: 'a', screen: 'Home', position: { x: 0, y: 0 } }],
      connectors: [{ id: 'c', from: 'a', to: 'missing' }],
    }
    await expect(
      saveCanvas(root, { project: 'orbit', canvas: 'home', data: bad }),
    ).rejects.toThrow(/Unknown frame "missing"/)
    const unchanged = await readCanvas(root, 'orbit', 'home')
    expect(unchanged.frames).toEqual([])
  })

  it('writes pretty JSON with a trailing newline', async () => {
    await scaffold()
    await saveCanvas(root, {
      project: 'orbit',
      canvas: 'home',
      data: { name: 'Renamed' },
    })
    const raw = await readFile(canvasPath(root, 'orbit', 'home'), 'utf8')
    expect(raw.endsWith('}\n')).toBe(true)
    expect(raw).toContain('\n  "name": "Renamed"')
  })

  it('reports a timestamp per canvas', async () => {
    await scaffold()
    const stamps = await canvasTimestamps(root)
    expect(Object.keys(stamps)).toEqual(['orbit/home'])
  })
})
