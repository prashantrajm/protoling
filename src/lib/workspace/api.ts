import type { Canvas } from '../schema'

/** Client for the dev plugin's endpoints (vite/springboard-plugin.ts). */

export const canEdit = import.meta.env.DEV

export class ApiError extends Error {}

async function request<T>(method: string, route: string, body?: unknown): Promise<T> {
  if (!canEdit)
    throw new ApiError('This is a read-only build. Run `bun run dev` to edit.')
  const response = await fetch(`/__springboard/${route}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Springboard': '1' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok)
    throw new ApiError(data.error ?? `Request failed (${response.status})`)
  return data as T
}

export const api = {
  saveCanvas: (project: string, canvas: string, data: Canvas) =>
    request<{ ok: true }>('PUT', 'canvas', { project, canvas, data }),
  createProject: (body: { slug: string; name: string; description?: string }) =>
    request<{ slug: string }>('POST', 'project', body),
  createCanvas: (body: {
    project: string
    slug: string
    name: string
    device?: string
  }) => request<{ slug: string }>('POST', 'canvas', body),
  createScreen: (body: {
    project: string
    canvas: string
    name: string
    position?: { x: number; y: number }
  }) => request<{ frameId: string }>('POST', 'screen', body),
}

export interface Meta {
  updatedAt: Record<string, string>
  network: { exposed: boolean; urls: string[] }
}

export async function fetchMeta(): Promise<Meta | null> {
  if (!canEdit) return null
  try {
    const response = await fetch('/__springboard/meta')
    return response.ok ? ((await response.json()) as Meta) : null
  } catch {
    return null
  }
}

/** "Orbit Two" → "orbit-two" */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** "order detail" → "OrderDetail" */
export function screenNameFrom(value: string): string {
  const name = value
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return /^[0-9]/.test(name) ? `Screen${name}` : name
}
