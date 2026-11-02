import type { IncomingMessage, ServerResponse } from 'node:http'
import { networkInterfaces } from 'node:os'
import type { Plugin, ViteDevServer } from 'vite'
import {
  canvasTimestamps,
  createCanvas,
  createProject,
  createScreen,
  RequestError,
  saveCanvas,
} from './project-files.ts'

/**
 * Dev-server endpoints that write projects back to disk. Reads go through
 * `import.meta.glob` in the app, so they work in a static build too.
 *
 * `bun run dev:phone` exposes the server on the LAN so a phone can open
 * previews. Writes are therefore limited to this machine, and require headers
 * a cross-site page can't send without a CORS preflight, which is never
 * approved.
 */

const prefix = '/__springboard/'

type Handler = (root: string, body: Record<string, unknown>) => Promise<unknown>

const writes: Record<string, Handler> = {
  'PUT canvas': saveCanvas,
  'POST project': createProject,
  'POST canvas': createCanvas,
  'POST screen': createScreen,
}

export function springboard(): Plugin {
  return {
    name: 'springboard',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith(prefix)) return next()
        const route = req.url.slice(prefix.length).split('?')[0]
        try {
          if (req.method === 'GET' && route === 'meta') {
            return send(res, 200, {
              updatedAt: await canvasTimestamps(server.config.root),
              network: networkInfo(server),
            })
          }
          const handler = writes[`${req.method} ${route}`]
          if (!handler) throw new RequestError('Not found', 404)
          assertTrustedWrite(req)
          const result = await handler(server.config.root, await readJson(req))
          send(res, 200, result ?? { ok: true })
        } catch (error) {
          const status = error instanceof RequestError ? error.status : 500
          const message = error instanceof Error ? error.message : String(error)
          if (status === 500) server.config.logger.error(`[springboard] ${message}`)
          send(res, status, { error: message })
        }
      })
    },
  }
}

const loopback = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])

export function assertTrustedWrite(req: IncomingMessage): void {
  if (!loopback.has(req.socket.remoteAddress ?? '')) {
    throw new RequestError(
      'Editing is only allowed from the computer running Springboard',
      403,
    )
  }
  if (req.headers['x-springboard'] !== '1') {
    throw new RequestError('Missing X-Springboard header', 403)
  }
  if (!String(req.headers['content-type']).startsWith('application/json')) {
    throw new RequestError('Expected application/json', 415)
  }
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 2_000_000) throw new RequestError('Request too large', 413)
    chunks.push(chunk)
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
    if (typeof value !== 'object' || value === null) throw new Error()
    return value
  } catch {
    throw new RequestError('Invalid JSON body')
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
  // Not listening on the LAN. Report where it would be, so the UI can say how to enable it.
  const port = server.config.server.port ?? 3000
  const urls = Object.values(networkInterfaces())
    .flat()
    .filter((net) => net && net.family === 'IPv4' && !net.internal)
    .map((net) => `http://${net?.address}:${port}/`)
  return { exposed: false, urls }
}
