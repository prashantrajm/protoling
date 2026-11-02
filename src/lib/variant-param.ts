/**
 * Variant choices live in the URL so a link reproduces exactly what you saw:
 * `?v=today:soft-spring,today/detail:quick-fade`. Keys are screen keys (the
 * route path inside the project); screens not listed use their default.
 */
export type VariantChoices = Record<string, string>

export function parseVariants(value: unknown): VariantChoices {
  if (typeof value !== 'string' || value === '') return {}
  const choices: VariantChoices = {}
  for (const pair of value.split(',')) {
    const at = pair.lastIndexOf(':')
    if (at <= 0 || at === pair.length - 1) continue
    choices[pair.slice(0, at)] = pair.slice(at + 1)
  }
  return choices
}

export function serializeVariants(choices: VariantChoices): string | undefined {
  const pairs = Object.entries(choices)
    .filter(([, id]) => id && id !== 'default')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, id]) => `${key}:${id}`)
  return pairs.length ? pairs.join(',') : undefined
}

export function withVariant(value: unknown, key: string, id: string): string | undefined {
  return serializeVariants({ ...parseVariants(value), [key]: id })
}

/** "/orbit/today/detail" in project "orbit" → "today/detail". The project root is "index". */
export function screenKey(fullPath: string, project: string): string {
  const inside = fullPath
    .replace(new RegExp(`^/${project}(?=/|$)`), '')
    .replace(/^\/+|\/+$/g, '')
  return inside || 'index'
}
