/** Read-only client for the dev plugin (vite/springboard-plugin.ts). */

export interface Meta {
  /** Newest edit time per project. */
  updatedAt: Record<string, string>
  network: { exposed: boolean; urls: string[] }
}

export async function fetchMeta(): Promise<Meta | null> {
  if (!import.meta.env.DEV) return null
  try {
    const response = await fetch('/__springboard/meta')
    return response.ok ? ((await response.json()) as Meta) : null
  } catch {
    return null
  }
}
