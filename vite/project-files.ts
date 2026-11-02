import { mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  type Canvas,
  canvasSchema,
  formatIssues,
  projectSchema,
  screenNamePattern,
  slugPattern,
} from '../src/lib/schema.ts'

/**
 * File operations behind the dev plugin's endpoints. Everything is confined
 * to `<root>/projects`; every path segment is validated before use.
 */

export class RequestError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message)
  }
}

export function projectsDir(root: string): string {
  return path.join(root, 'projects')
}

function assertSlug(value: unknown, field: string): string {
  if (typeof value !== 'string' || !slugPattern.test(value)) {
    throw new RequestError(`${field} must be lowercase letters, digits and dashes`)
  }
  return value
}

function assertScreenName(value: unknown): string {
  if (typeof value !== 'string' || !screenNamePattern.test(value)) {
    throw new RequestError('Screen name must be PascalCase, e.g. "Home" or "OrderDetail"')
  }
  return value
}

/** Joins inside projects/ and refuses anything that resolves outside it. */
function inside(root: string, ...segments: string[]): string {
  const base = projectsDir(root)
  const target = path.resolve(base, ...segments)
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new RequestError('Path escapes the projects folder', 403)
  }
  return target
}

async function exists(file: string): Promise<boolean> {
  try {
    await stat(file)
    return true
  } catch {
    return false
  }
}

/** Write to a temp file then rename, so a crash never leaves half a JSON file. */
async function writeAtomic(file: string, contents: string): Promise<void> {
  const temp = `${file}.${process.pid}.tmp`
  await writeFile(temp, contents)
  await rename(temp, file)
}

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`
}

export function canvasPath(root: string, project: string, canvas: string): string {
  return inside(
    root,
    assertSlug(project, 'project'),
    'canvases',
    assertSlug(canvas, 'canvas'),
    'canvas.json',
  )
}

export async function readCanvas(
  root: string,
  project: string,
  canvas: string,
): Promise<Canvas> {
  const file = canvasPath(root, project, canvas)
  if (!(await exists(file))) throw new RequestError('Canvas not found', 404)
  const parsed = canvasSchema.safeParse(JSON.parse(await readFile(file, 'utf8')))
  if (!parsed.success) throw new RequestError(formatIssues(parsed.error), 422)
  return parsed.data
}

export async function saveCanvas(
  root: string,
  body: { project?: unknown; canvas?: unknown; data?: unknown },
): Promise<void> {
  const file = canvasPath(root, body.project as string, body.canvas as string)
  if (!(await exists(file))) throw new RequestError('Canvas not found', 404)
  const parsed = canvasSchema.safeParse(body.data)
  if (!parsed.success) throw new RequestError(formatIssues(parsed.error), 422)
  await writeAtomic(file, json(parsed.data))
}

export async function createProject(
  root: string,
  body: { slug?: unknown; name?: unknown; description?: unknown },
): Promise<{ slug: string }> {
  const slug = assertSlug(body.slug, 'slug')
  const dir = inside(root, slug)
  if (await exists(dir))
    throw new RequestError(`A project named "${slug}" already exists`, 409)
  const project = projectSchema.safeParse({
    name: body.name,
    description: body.description || undefined,
  })
  if (!project.success) throw new RequestError(formatIssues(project.error), 422)
  await mkdir(path.join(dir, 'canvases'), { recursive: true })
  await writeAtomic(path.join(dir, 'project.json'), json(project.data))
  return { slug }
}

export async function createCanvas(
  root: string,
  body: { project?: unknown; slug?: unknown; name?: unknown; device?: unknown },
): Promise<{ slug: string }> {
  const project = assertSlug(body.project, 'project')
  const slug = assertSlug(body.slug, 'slug')
  if (!(await exists(inside(root, project, 'project.json')))) {
    throw new RequestError('Project not found', 404)
  }
  const dir = inside(root, project, 'canvases', slug)
  if (await exists(dir))
    throw new RequestError(`A canvas named "${slug}" already exists`, 409)
  const canvas = canvasSchema.safeParse({
    name: body.name,
    device: body.device || undefined,
  })
  if (!canvas.success) throw new RequestError(formatIssues(canvas.error), 422)
  await mkdir(path.join(dir, 'screens'), { recursive: true })
  await writeAtomic(path.join(dir, 'canvas.json'), json(canvas.data))
  return { slug }
}

/** Creates `screens/<Name>.tsx` from the template and places a frame for it. */
export async function createScreen(
  root: string,
  body: { project?: unknown; canvas?: unknown; name?: unknown; position?: unknown },
): Promise<{ frameId: string }> {
  const name = assertScreenName(body.name)
  const canvas = await readCanvas(root, body.project as string, body.canvas as string)
  const file = inside(
    root,
    body.project as string,
    'canvases',
    body.canvas as string,
    'screens',
    `${name}.tsx`,
  )
  if (await exists(file)) throw new RequestError(`Screen "${name}" already exists`, 409)

  const frameId = uniqueId(
    name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase(),
    canvas.frames.map((f) => f.id),
  )
  const position = isPoint(body.position) ? body.position : nextPosition(canvas)
  canvas.frames.push({
    id: frameId,
    screen: name,
    position,
    statusBar: true,
    variants: [],
  })

  await mkdir(path.dirname(file), { recursive: true })
  await writeAtomic(file, screenTemplate(name))
  await writeAtomic(
    canvasPath(root, body.project as string, body.canvas as string),
    json(canvasSchema.parse(canvas)),
  )
  return { frameId }
}

function isPoint(value: unknown): value is { x: number; y: number } {
  const p = value as { x?: unknown; y?: unknown } | null
  return typeof p?.x === 'number' && typeof p?.y === 'number'
}

function nextPosition(canvas: Canvas): { x: number; y: number } {
  if (canvas.frames.length === 0) return { x: 0, y: 0 }
  const right = Math.max(...canvas.frames.map((f) => f.position.x))
  return { x: right + 520, y: 0 }
}

function uniqueId(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base
  let i = 2
  while (taken.includes(`${base}-${i}`)) i++
  return `${base}-${i}`
}

export function screenTemplate(name: string): string {
  return `import { motion } from 'motion/react'
import { defineScreen, spring, useMotion } from '@/runtime'

export default defineScreen({
  name: '${name}',
  motion: {
    enter: spring(0.45, 0.2),
  },
  component: ${name},
})

function ${name}() {
  const enter = useMotion('enter')

  return (
    <div className="flex h-full flex-col bg-white px-5 pt-[calc(var(--safe-top)+16px)] text-neutral-900">
      <motion.h1
        className="text-[34px] font-bold tracking-tight"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={enter}
      >
        ${name}
      </motion.h1>
    </div>
  )
}
`
}

/** Newest modification time of anything inside each canvas folder. */
export async function canvasTimestamps(root: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  const base = projectsDir(root)
  if (!(await exists(base))) return result
  for (const project of await readdir(base)) {
    if (!slugPattern.test(project)) continue
    const canvasesDir = path.join(base, project, 'canvases')
    if (!(await exists(canvasesDir))) continue
    for (const canvas of await readdir(canvasesDir)) {
      if (!slugPattern.test(canvas)) continue
      const newest = await newestMtime(path.join(canvasesDir, canvas))
      if (newest) result[`${project}/${canvas}`] = new Date(newest).toISOString()
    }
  }
  return result
}

async function newestMtime(dir: string): Promise<number> {
  let newest = 0
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) newest = Math.max(newest, await newestMtime(full))
    else if (entry.isFile()) newest = Math.max(newest, (await stat(full)).mtimeMs)
  }
  return newest
}
