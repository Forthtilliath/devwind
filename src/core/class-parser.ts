import { taxonomy } from '../data/taxonomy'
import generatedClasses from '../data/generated/tailwind-v3-classes.json'
import type { GeneratedClass, ParsedClass, TaxonomyEntry } from '../types'

/**
 * Classes réellement générées (cf. scripts/generate-tailwind-data.ts), regroupées par entrée
 * de taxonomie : sert de source de vérité pour valider qu'un candidat "préfixe + suffixe" est
 * une vraie classe Tailwind POUR CETTE ENTRÉE PRÉCISE. Le regroupement par entrée (plutôt qu'un
 * seul Set global) est nécessaire : `text-xl` est une classe valide de fontSize, mais si on
 * testait juste "cette chaîne existe-t-elle quelque part dans le dataset", elle validerait à
 * tort un candidat textColor également (les deux entrées partagent le préfixe `text`).
 */
const VALID_CLASS_NAMES_BY_ENTRY = new Map<string, Set<string>>()
for (const c of generatedClasses as GeneratedClass[]) {
  const set = VALID_CLASS_NAMES_BY_ENTRY.get(c.taxonomyId) ?? new Set<string>()
  set.add(c.className)
  VALID_CLASS_NAMES_BY_ENTRY.set(c.taxonomyId, set)
}

/**
 * Découpe une classe en variants + base, en respectant la profondeur de crochets
 * (une valeur arbitraire comme `bg-[url(https://x:80)]` contient un `:` qui n'est
 * pas un séparateur de variant).
 */
export function splitVariants(cls: string): ParsedClass {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < cls.length; i++) {
    const c = cls[i]
    if (c === '[') depth++
    else if (c === ']') depth--
    else if (c === ':' && depth === 0) {
      parts.push(cls.slice(start, i))
      start = i + 1
    }
  }
  parts.push(cls.slice(start))
  return { raw: cls, variants: parts.slice(0, -1), base: parts[parts.length - 1] }
}

export interface ClassMatch {
  entry: TaxonomyEntry
  prefix: string
  /** valeur après le préfixe (clé de thème, ou contenu de `[...]` si arbitraire) */
  suffix: string
  isArbitrary: boolean
  isNegative: boolean
}

function toClassName(prefix: string, suffix: string, isNegative: boolean): string {
  const base = prefix === '' ? suffix : `${prefix}-${suffix}`
  return isNegative ? `-${base}` : base
}

/**
 * Fait correspondre une classe "base" (sans variants) à son entrée de taxonomie.
 * Les entrées `static` sont testées avant les entrées `scale`/`color` (ex. `text-left`
 * doit matcher `textAlign`, pas `fontSize`). Pour les entrées `scale`/`color`, un candidat
 * "préfixe + suffixe" n'est retenu que s'il correspond à une classe réellement générée
 * (VALID_CLASS_NAMES) : ça désambiguïse naturellement les préfixes partagés (`text-red-500`
 * -> textColor, `text-xl` -> fontSize) et évite de confondre une classe custom qui partage
 * un préfixe par coïncidence (`my-custom-btn`) avec une vraie classe Tailwind.
 */
export function matchTaxonomy(base: string, entries: TaxonomyEntry[] = taxonomy): ClassMatch | null {
  const isNegative = base.startsWith('-')
  const working = isNegative ? base.slice(1) : base

  for (const entry of entries) {
    if (entry.type !== 'static') continue
    if (isNegative) continue
    for (const prefix of entry.prefixes) {
      for (const value of entry.staticValues ?? []) {
        const cls = prefix === '' ? value : `${prefix}-${value}`
        if (working === cls) {
          return { entry, prefix, suffix: value, isArbitrary: false, isNegative: false }
        }
      }
    }
  }

  for (const entry of entries) {
    if (entry.type === 'static') continue
    if (isNegative && !entry.supportsNegative) continue
    for (const prefix of entry.prefixes) {
      if (prefix === '') continue
      const dashPrefix = `${prefix}-`
      if (!working.startsWith(dashPrefix)) continue
      const suffix = working.slice(dashPrefix.length)
      if (!suffix) continue

      const arbitraryMatch = /^\[(.+)\]$/.exec(suffix)
      if (arbitraryMatch) {
        if (!entry.supportsArbitrary) continue
        return { entry, prefix, suffix: arbitraryMatch[1], isArbitrary: true, isNegative }
      }

      if (VALID_CLASS_NAMES_BY_ENTRY.get(entry.id)?.has(toClassName(prefix, suffix, isNegative))) {
        return { entry, prefix, suffix, isArbitrary: false, isNegative }
      }
    }
  }

  return null
}

export function parseClass(cls: string, entries: TaxonomyEntry[] = taxonomy): { parsed: ParsedClass; match: ClassMatch | null } {
  const parsed = splitVariants(cls)
  return { parsed, match: matchTaxonomy(parsed.base, entries) }
}
