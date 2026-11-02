import { readdir, stat } from 'node:fs/promises'
import path from 'node:path'

/** Newest modification time of anything inside each project folder. */
export async function projectTimestamps(
  root: string,
  projects: string[],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  for (const project of projects) {
    const newest = await newestMtime(path.join(root, 'projects', project))
    if (newest) result[project] = new Date(newest).toISOString()
  }
  return result
}

async function newestMtime(dir: string): Promise<number> {
  let newest = 0
  let entries: import('node:fs').Dirent[]
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return 0
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) newest = Math.max(newest, await newestMtime(full))
    else if (entry.isFile()) newest = Math.max(newest, (await stat(full)).mtimeMs)
  }
  return newest
}
