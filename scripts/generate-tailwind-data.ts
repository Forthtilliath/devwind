// Script de build : croise `resolveConfig` (thème par défaut Tailwind v3, API publique
// et stable) avec la taxonomie hand-authored (src/data/taxonomy.ts) pour produire le
// dataset des classes utilitaires, SANS jamais taper une classe à la main.
// Sortie versionnée : src/data/generated/tailwind-v3-classes.json (bundlée par Vite, pas de fetch runtime).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import resolveConfig from 'tailwindcss/resolveConfig'
import { taxonomy } from '../src/data/taxonomy'
import type { GeneratedClass, TaxonomyEntry } from '../src/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const { theme } = resolveConfig({ content: [] }) as { theme: Record<string, unknown> }

function className(prefix: string, key: string): string {
  return prefix === '' ? key : `${prefix}-${key}`
}

/** Aplati un objet de thème imbriqué (couleurs) en paires { suffixe de classe, valeur }. */
function flattenThemeScale(scale: unknown, prefix = ''): Array<{ key: string; value: string }> {
  if (typeof scale === 'string') return [{ key: prefix, value: scale }]
  if (typeof scale !== 'object' || scale === null) return []
  const out: Array<{ key: string; value: string }> = []
  for (const [k, v] of Object.entries(scale as Record<string, unknown>)) {
    if (k === '__CSS_VALUES__') continue
    const nextKey = k === 'DEFAULT' ? prefix : prefix ? `${prefix}-${k}` : k
    if (typeof v === 'string') {
      out.push({ key: nextKey, value: v })
    } else if (typeof v === 'object' && v !== null) {
      out.push(...flattenThemeScale(v, nextKey))
    }
  }
  return out
}

/** Pour fontSize v3 : valeur = string, ou [taille, {lineHeight}] / [taille, lineHeight]. */
function stringifyThemeValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return String(value[0])
  return JSON.stringify(value)
}

function entriesForTaxonomy(entry: TaxonomyEntry): GeneratedClass[] {
  const out: GeneratedClass[] = []

  if (entry.type === 'static') {
    for (const value of entry.staticValues ?? []) {
      for (const prefix of entry.prefixes) {
        out.push({
          className: className(prefix, value),
          taxonomyId: entry.id,
          category: entry.category,
          subcategory: entry.subcategory,
          themeKey: null,
          themeToken: null,
          negative: false,
        })
      }
    }
    return out
  }

  if (!entry.themeKey) return out
  const scale = theme[entry.themeKey]
  const flat = entry.type === 'color' ? flattenThemeScale(scale) : flattenScaleFlat(scale)

  for (const { key, value } of flat) {
    for (const prefix of entry.prefixes) {
      out.push({
        className: className(prefix, key),
        taxonomyId: entry.id,
        category: entry.category,
        subcategory: entry.subcategory,
        themeKey: entry.themeKey,
        themeToken: stringifyThemeValue(value),
        negative: false,
      })
      if (entry.supportsNegative && /^[0-9.]/.test(key)) {
        out.push({
          className: `-${className(prefix, key)}`,
          taxonomyId: entry.id,
          category: entry.category,
          subcategory: entry.subcategory,
          themeKey: entry.themeKey,
          themeToken: stringifyThemeValue(value),
          negative: true,
        })
      }
    }
  }
  return out
}

/** Pour les échelles non-couleur (spacing, fontSize, fontWeight...) : un seul niveau, pas de nesting. */
function flattenScaleFlat(scale: unknown): Array<{ key: string; value: string }> {
  if (typeof scale !== 'object' || scale === null) return []
  return Object.entries(scale as Record<string, unknown>).map(([key, value]) => ({
    key,
    value: stringifyThemeValue(value),
  }))
}

const generated: GeneratedClass[] = taxonomy.flatMap(entriesForTaxonomy)

const outDir = path.resolve(__dirname, '../src/data/generated')
fs.mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, 'tailwind-v3-classes.json')
fs.writeFileSync(outFile, JSON.stringify(generated, null, 2))

console.log(`[generate-tailwind-data] ${generated.length} classes générées -> ${path.relative(process.cwd(), outFile)}`)
