import { toast } from 'sonner'

/**
 * Preview links: the app on its own, at this site's own address. That's
 * localhost when you're running Protoling locally, and your domain when it's
 * deployed, so there's nothing to configure.
 */

/** "/orbit" + "today/detail" + "?v=…" → "/orbit/today/detail?v=…" */
export function appPath(project: string, inside: string, search = ''): string {
  const path = inside.replace(/^\/+|\/+$/g, '')
  return `/${project}${path ? `/${path}` : ''}${search}`
}

export function previewUrl(path: string, origin = window.location.origin): string {
  return new URL(path, origin).href
}

export async function copyPreviewLink(path: string): Promise<string> {
  const url = previewUrl(path)
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Preview link copied', { description: url })
  } catch {
    // Clipboard access needs a secure context or a user gesture; show it instead.
    toast('Copy this preview link', { description: url, duration: 10_000 })
  }
  return url
}

export function openPreview(path: string): void {
  window.open(previewUrl(path), '_blank', 'noopener')
}
