import type { BreakpointVote } from '../types'

/** Nom de breakpoint -> longueur CSS de son seuil (`40rem`, `768px`...), telle que le site l'écrit. */
export type BreakpointMap = Readonly<Record<string, string>>

// Breakpoints par défaut de Tailwind v4 (en rem, comme le CSS qu'il génère). Remplacés/complétés
// par ceux réellement utilisés par le site (media queries de son CSS, cf. breakpoint-scanner.ts)
// dès que le panneau les connaît. Source unique pour la synthèse (variant-plan.ts), la détection
// de préfixe de site (prefix-candidates.ts) et la toolbar de variants du panneau.
export const DEFAULT_BREAKPOINTS: BreakpointMap = { sm: '40rem', md: '48rem', lg: '64rem', xl: '80rem', '2xl': '96rem' }

export function isDefaultBreakpoint(name: string): boolean {
  return Object.hasOwn(DEFAULT_BREAKPOINTS, name)
}

const LENGTH_RE = /^(\d+(?:\.\d+)?|\.\d+)(px|rem|em)$/

export function isBreakpointLength(value: string): boolean {
  return LENGTH_RE.test(value)
}

/** Seuil approximatif en px (rem/em à 16px, comme une media query) : sert à trier, pas à rendre. */
export function breakpointPx(length: string): number {
  const m = LENGTH_RE.exec(length)
  if (!m) return Number.POSITIVE_INFINITY
  return m[2] === 'px' ? Number(m[1]) : Number(m[1]) * 16
}

/** Noms triés du plus petit au plus grand seuil (ordre d'affichage de la toolbar). */
export function sortedBreakpointNames(map: BreakpointMap): string[] {
  return Object.keys(map).sort((a, b) => breakpointPx(map[a]) - breakpointPx(map[b]))
}

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/

/**
 * Breakpoints réellement utilisés par le site, déduits des votes collectés dans ses media
 * queries (cf. breakpoint-scanner.ts) : `(width >= X)` autour de `.sm\:…` vote `sm = X`,
 * `(width < X)` autour de `.max-sm\:…` aussi. `sitePrefix` (`tw:sm:flex`) : le breakpoint est
 * alors le second variant. Pour un même nom, le seuil le plus fréquent l'emporte.
 */
export function breakpointsFromVotes(votes: BreakpointVote[], sitePrefix: string | null): Record<string, string> {
  const tally = new Map<string, Map<string, number>>()
  for (const [first, second, op, length, count] of votes) {
    let name = sitePrefix && first === sitePrefix ? second : first
    if (op === 'max') {
      if (!name.startsWith('max-')) continue
      name = name.slice(4)
    }
    if (!NAME_RE.test(name) || name.startsWith('max-') || !isBreakpointLength(length)) continue
    const lengths = tally.get(name) ?? new Map<string, number>()
    lengths.set(length, (lengths.get(length) ?? 0) + count)
    tally.set(name, lengths)
  }
  const result: Record<string, string> = {}
  for (const [name, lengths] of tally) {
    result[name] = [...lengths.entries()].sort((a, b) => b[1] - a[1])[0][0]
  }
  return result
}

/** Variables `--breakpoint-*` du thème (présentes seulement avec `@theme static` : Tailwind v4
 * n'émet pas les variables qu'aucune utilité ne référence via `var()`). */
export function breakpointsFromThemeVariables(variables: { name: string; value: string }[], sitePrefix: string | null): Record<string, string> {
  const namespace = sitePrefix ? `--${sitePrefix}-breakpoint-` : '--breakpoint-'
  const result: Record<string, string> = {}
  for (const { name, value } of variables) {
    if (!name.startsWith(namespace)) continue
    const bp = name.slice(namespace.length)
    if (NAME_RE.test(bp) && isBreakpointLength(value)) result[bp] = value
  }
  return result
}
