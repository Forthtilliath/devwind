import { splitVariants } from './split-variants'
import { readClassList } from './class-attr'
import { isDefaultBreakpoint } from './breakpoints'
import type { PrefixCandidate } from '../types'

// Liste des variants standards Tailwind (pseudo-classes ET pseudo-éléments) : `after`/`before`
// notamment sont de VRAIS variants Tailwind (`::after`/`::before`), pas des préfixes de site —
// oubliés initialement, ce qui les faisait détecter à tort comme préfixe custom sur un site qui
// les utilise (ex. `after:content-['']`). Liste volontairement large pour éviter de futurs faux
// positifs similaires plutôt que de la compléter au fil des rapports de bugs.
const KNOWN_PSEUDO = new Set([
  // Pseudo-classes
  'hover', 'focus', 'focus-visible', 'focus-within', 'active', 'visited', 'target',
  'first', 'last', 'only', 'odd', 'even', 'first-of-type', 'last-of-type', 'only-of-type',
  'empty', 'disabled', 'enabled', 'checked', 'indeterminate', 'default', 'required', 'optional',
  'valid', 'invalid', 'in-range', 'out-of-range', 'placeholder-shown', 'autofill', 'read-only',
  'open', 'inert', 'dark',
  // Pseudo-éléments
  'before', 'after', 'placeholder', 'file', 'marker', 'selection', 'first-line', 'first-letter', 'backdrop',
  // v4
  'starting',
])

function isKnownVariantToken(token: string): boolean {
  if (isDefaultBreakpoint(token)) return true
  if (token.startsWith('max-') && isDefaultBreakpoint(token.slice(4))) return true
  if (KNOWN_PSEUDO.has(token)) return true
  if (/^(group|peer|not)-/.test(token)) return true
  if (/^aria-/.test(token)) return true
  if (/^has-\[/.test(token)) return true
  if (/^data-\[/.test(token)) return true
  return false
}

/**
 * Côté page, partie DOM de la détection du préfixe de site (option `prefix` de Tailwind v4 —
 * syntaxe `tw:bg-red-500`, un variant supplémentaire en tête, PAS un tiret collé comme en v3) :
 * un seul parcours du DOM, qui recense les classes dont le premier variant est inconnu. Le
 * panneau, qui a la taxonomie, ne garde que celles dont la base est une vraie classe Tailwind
 * (cf. site-prefix.ts).
 */
export function collectPrefixCandidates(doc: Document = document): PrefixCandidate[] {
  const counts = new Map<string, PrefixCandidate>()
  for (const el of Array.from(doc.querySelectorAll('[class]'))) {
    for (const raw of readClassList(el)) {
      const { variants, base } = splitVariants(raw)
      const [first, ...rest] = variants
      if (!first || isKnownVariantToken(first)) continue
      if (!/^[a-z][a-z0-9-]*$/.test(first)) continue
      if (rest.some((v) => !isKnownVariantToken(v))) continue
      const key = `${first}\n${base}`
      const candidate = counts.get(key)
      if (candidate) candidate[2]++
      else counts.set(key, [first, base, 1])
    }
  }
  return Array.from(counts.values())
}
