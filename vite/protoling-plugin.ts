import type { ServerResponse } from 'node:http'
import { networkInterfaces } from 'node:os'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'
import { projectTimestamps } from './project-files.ts'
import { discoverProjects } from './projects.ts'

/**
 * Read-only dev endpoint (edit times and LAN URLs for "Open on phone"), plus
 * a restart when a project is added or removed, because projects are mounted
 * into the route tree when the server starts.
 *
 * Protoling never writes your files: prototypes are code you write.
 */
export function protoling({ projects }: { projects: string[] }): Plugin {
  return {
    name: 'protoling',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root
      const known = projects.join(',')
      const maybeRestart = (file: string) => {
        const rel = path.relative(path.join(root, 'projects'), file)
        if (rel.startsWith('..') || !rel.includes(`${path.sep}app`)) return
        let next: string
        try {
          next = discoverProjects(root).join(',')
        } catch (error) {
          server.config.logger.error(String(error))
          return
        }
        if (next !== known) {
          server.config.logger.info('[protoling] Projects changed, restarting…')
          void server.restart()
        }
      }
      server.watcher.on('add', maybeRestart)
      server.watcher.on('unlink', maybeRestart)
      server.watcher.on('unlinkDir', maybeRestart)

      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/__protoling/meta') return next()
        try {
          send(res, 200, {
            updatedAt: await projectTimestamps(root, projects),
            network: networkInfo(server),
          })
        } catch (error) {
          send(res, 500, {
            error: error instanceof Error ? error.message : String(error),
          })
        }
      })
    },
  }
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function networkInfo(server: ViteDevServer): { exposed: boolean; urls: string[] } {
  const resolved = server.resolvedUrls?.network ?? []
  if (resolved.length > 0) return { exposed: true, urls: resolved }
  const port = server.config.server.port ?? 3000
  const urls = Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => `http://${net?.address}:${port}/`)
  return { exposed: false, urls }
}
