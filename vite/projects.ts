import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Projects that have an app/ folder. Each one is mounted as a mini app at
 * /<project>, so its name must not collide with Springboard's own routes or
 * with paths the dev server serves.
 */
export const reservedNames = new Set([
  'p',
  'assets',
  'src',
  'projects',
  'public',
  'node_modules',
  '__springboard',
])

const slug = /^[a-z0-9][a-z0-9-]*$/

export function discoverProjects(root: string): string[] {
  const dir = path.join(root, 'projects')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => existsSync(path.join(dir, name, 'app', 'route.tsx')))
    .map((name) => {
      if (!slug.test(name)) {
        throw new Error(
          `[springboard] Project folder "${name}" must be lowercase letters, digits and dashes.`,
        )
      }
      if (reservedNames.has(name)) {
        throw new Error(
          `[springboard] "${name}" is reserved by Springboard. Rename projects/${name}.`,
        )
      }
      return name
    })
    .sort()
}
