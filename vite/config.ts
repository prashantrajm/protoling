/**
 * protoling.config.ts — settings read at build time.
 *
 * Today it only configures share builds (`bun run build:share`): a deployment
 * with just the prototypes, for clients and teammates, and none of
 * Protoling's tooling.
 */
export interface ProtolingConfig {
  share?: {
    /** Projects to include. Defaults to every project with an app/ folder. */
    projects?: string[]
    /** Where `/` and unknown URLs go, e.g. "/orbit/welcome". Defaults to the first project. */
    start?: string
  }
}

export function defineConfig(config: ProtolingConfig): ProtolingConfig {
  return config
}

export type BuildMode = 'full' | 'share'

export interface ResolvedShare {
  projects: string[]
  start: string
}

/** Checks the share settings against the projects that actually exist. */
export function resolveShare(
  config: ProtolingConfig,
  discovered: string[],
): ResolvedShare {
  const wanted = config.share?.projects ?? discovered
  const unknown = wanted.filter((p) => !discovered.includes(p))
  if (unknown.length) {
    throw new Error(
      `[protoling] protoling.config.ts lists projects that don't exist or have no app/route.tsx: ${unknown.join(', ')}`,
    )
  }
  if (wanted.length === 0) {
    throw new Error(
      '[protoling] A share build needs at least one project with an app/ folder.',
    )
  }
  const start = config.share?.start ?? `/${wanted[0]}`
  const startProject = start.split('/')[1]
  if (!start.startsWith('/') || !wanted.includes(startProject)) {
    throw new Error(
      `[protoling] share.start "${start}" must be a path inside one of the shared projects (${wanted.join(', ')}).`,
    )
  }
  return { projects: wanted, start }
}

/**
 * Narrows `import.meta.glob('/projects/*…')` patterns to the shared projects,
 * so other projects' files, and even their folder names, stay out of the
 * bundle.
 */
export function narrowProjectGlobs(code: string, projects: string[]): string {
  const scope = projects.length === 1 ? projects[0] : `{${projects.join(',')}}`
  return code.replace(/(['"`])\/projects\/\*\//g, `$1/projects/${scope}/`)
}
