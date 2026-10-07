import { ARBITRARY_ENTRY_BY_PREFIX, CLASS_BY_NAME, TAXONOMY_BY_ID } from '../data/classes'
import { splitVariants } from './split-variants'
import { decodeArbitraryValue } from './arbitrary-value'
import { COMPOSITE_BY_PREFIX, compositeDeclarations } from './composite'
import { planVariants, wrapMedia } from './variant-plan'
import { filterSupportedDeclarations } from './css-guard'
import { DEFAULT_BREAKPOINTS } from './breakpoints'
import type { BreakpointMap } from './breakpoints'
import type { GeneratedClass, LiveRule, TaxonomyEntry } from '../types'

// Synthèse, côté panneau, du CSS qui prévisualise une classe absente du CSS du site. La page
// (content/live-injection.ts) se contente de vérifier qu'aucune vraie règle n'existe, puis
// d'injecter ce CSS : elle n'embarque ainsi ni la taxonomie ni le dataset.

// --- Valeurs : variables de thème v4 + multiplicateur spacing ---
//
// Vérifié en compilant du vrai CSS avec @tailwindcss/cli v4.3.3 (pas deviné) : les utilitaires
// v4 référencent de vraies variables CSS `@theme` pour les échelles à jetons NOMMÉS
// (`.bg-red-500 { background-color: var(--color-red-500) }`, `.rounded-lg { border-radius:
// var(--radius-lg) }`), mais inlinent littéralement les échelles purement numériques (opacity,
// scale, rotate, brightness...). En référençant nous aussi ces mêmes variables (avec notre
// valeur par défaut en fallback CSS natif), on hérite automatiquement de la vraie valeur du
// site s'il définit cette classe ailleurs sur la page — pas besoin d'un scan de détection
// séparé, le fallback `var(x, y)` fait le travail tout seul.
const THEME_VAR_PREFIX: Partial<Record<string, string>> = {
  backgroundColor: '--color-',
  textColor: '--color-',
  borderColor: '--color-',
  ringColor: '--color-',
  divideColor: '--color-',
  accentColor: '--color-',
  borderRadius: '--radius-',
  blur: '--blur-',
  backdropBlur: '--blur-', // même espace de noms que `blur` (vérifié : backdrop-blur-md référence aussi --blur-md)
  fontSize: '--text-',
  fontWeight: '--font-weight-',
  transitionTimingFunction: '--ease-',
  animation: '--animate-',
}

// `sitePrefix` : préfixe de site détecté (option `prefix` de Tailwind v4, cf. site-prefix.ts).
// Vérifié en compilant avec `@tailwindcss/cli --prefix tw` : le préfixe s'insère juste après
// `--` dans TOUTES les variables de thème (`--color-red-500` -> `--tw-color-red-500`,
// `--spacing` -> `--tw-spacing`), mais PAS dans les variables internes `--tw-*` que Tailwind
// utilise pour composer transform/filter (celles-ci ne viennent pas de `@theme`, leur nom `tw`
// est un hasard de nommage interne à Tailwind, indépendant du préfixe configuré par le site).

function prefixedVarNamespace(namespace: string, sitePrefix: string | null): string {
  // `namespace` est du type '--color-' : insère le préfixe de site juste après les deux tirets.
  return sitePrefix ? `--${sitePrefix}-${namespace.slice(2)}` : namespace
}

function themeVarValue(taxonomyId: string, suffix: string, fallback: string, sitePrefix: string | null): string {
  const rawPrefix = THEME_VAR_PREFIX[taxonomyId]
  if (!rawPrefix) return fallback
  const namespace = prefixedVarNamespace(rawPrefix, sitePrefix)
  const varName = suffix ? `${namespace}${suffix}` : namespace.slice(0, -1) // forme nue (DEFAULT) : pas de tiret final
  return `var(${varName}, ${fallback})`
}

/** Entrées dont v4 multiplie une variable `--spacing` partagée (`calc(var(--spacing) * N)`)
 * plutôt que d'inliner une valeur par palier de thème — vérifié pour padding/margin/gap/
 * width/height/translate. Seulement pour un suffixe purement numérique : les clés spéciales
 * (`px`, `full`, `auto`, `1/2`...) restent des littéraux (vérifié aussi, ex. `p-px` -> `1px`
 * littéral, `w-1/2` -> `calc(1 / 2 * 100%)` sans rapport avec `--spacing`). */
const SPACING_MULTIPLIED = new Set(['padding', 'margin', 'gap', 'width', 'minWidth', 'maxWidth', 'height', 'minHeight', 'maxHeight', 'translate'])
const DEFAULT_SPACING = '0.25rem'

function spacingCalc(suffix: string, negative: boolean, sitePrefix: string | null): string | null {
  if (!/^\d+(\.\d+)?$/.test(suffix)) return null
  const varName = sitePrefix ? `--${sitePrefix}-spacing` : '--spacing'
  return `calc(var(${varName}, ${DEFAULT_SPACING}) * ${negative ? '-' : ''}${suffix})`
}

function extractSuffix(classNameWithSign: string, prefix: string, negative: boolean): string {
  const withoutSign = negative ? classNameWithSign.slice(1) : classNameWithSign
  return prefix ? withoutSign.slice(prefix.length + 1) : withoutSign
}

/** Calcule la valeur CSS d'une classe générée (hors modificateur d'opacité, géré à part) :
 * multiplicateur spacing, variable de thème nommée avec fallback, ou littéral bundlé tel quel. */
function computeValue(entry: TaxonomyEntry, generated: GeneratedClass, suffix: string, sitePrefix: string | null): string {
  const literal = generated.negative ? `-${generated.themeToken}` : (generated.themeToken as string)
  if (SPACING_MULTIPLIED.has(entry.id)) {
    return spacingCalc(suffix, generated.negative, sitePrefix) ?? literal
  }
  return themeVarValue(entry.id, suffix, literal, sitePrefix)
}

/**
 * Détermine les déclarations CSS (`propriété: valeur`) d'une classe "base" (sans variants),
 * à partir de la taxonomie + du dataset généré (classes connues) ou en parsant directement
 * une valeur arbitraire (`bg-[#ff0000]`, non présente dans le dataset généré — toujours
 * littérale, comme le vrai Tailwind). Gère aussi le modificateur d'opacité (`bg-red-500/80`,
 * `bg-[#ff0000]/50`) et les propriétés composites (scale/translate/skew/filter/backdrop-filter,
 * cf. composite.ts).
 */
export function declarationsFor(base: string, sitePrefix: string | null = null): string[] | null {
  const opacitySplit = /^(.*)\/(\d{1,3})$/.exec(base)
  const withoutOpacity = opacitySplit ? opacitySplit[1] : base
  const opacityPct = opacitySplit ? Number(opacitySplit[2]) : null

  const generated = CLASS_BY_NAME.get(withoutOpacity)
  if (generated) {
    const entry = TAXONOMY_BY_ID.get(generated.taxonomyId)
    const props = entry?.cssProperties[generated.prefix]
    if (!entry || !props) return null

    if (entry.type === 'static') {
      const suffix = generated.prefix ? withoutOpacity.slice(generated.prefix.length + 1) : withoutOpacity
      const value = entry.staticValueMap?.[suffix] ?? suffix
      return props.map((p) => `${p}: ${value}`)
    }

    if (!generated.themeToken) return null
    const suffix = extractSuffix(withoutOpacity, generated.prefix, generated.negative)
    let value = computeValue(entry, generated, suffix, sitePrefix)
    if (opacityPct != null && entry.type === 'color') {
      value = `color-mix(in srgb, ${value} ${opacityPct}%, transparent)`
    }

    const composite = COMPOSITE_BY_PREFIX[generated.prefix]
    if (composite) return compositeDeclarations(composite, value)

    if (entry.id === 'fontSize') {
      const decls = [`font-size: ${value}`]
      if (generated.secondaryValue) {
        const lhVar = `${prefixedVarNamespace('--text-', sitePrefix)}${suffix}--line-height`
        const lhValue = suffix ? `var(${lhVar}, ${generated.secondaryValue})` : generated.secondaryValue
        decls.push(`line-height: ${lhValue}`)
      }
      return decls
    }

    return props.map((p) => `${p}: ${value}`)
  }

  const arbitraryMatch = /^(-?)([a-z][a-z-]*)-\[(.+)\]$/.exec(withoutOpacity)
  if (arbitraryMatch) {
    const [, neg, prefix, rawValue] = arbitraryMatch
    const entry = ARBITRARY_ENTRY_BY_PREFIX.get(prefix)
    const props = entry?.cssProperties[prefix]
    if (!entry || !props) return null

    let value = `${neg}${decodeArbitraryValue(rawValue)}`
    if (opacityPct != null && entry.type === 'color') {
      value = `color-mix(in srgb, ${value} ${opacityPct}%, transparent)`
    }

    const composite = COMPOSITE_BY_PREFIX[prefix]
    if (composite) return compositeDeclarations(composite, value)

    return props.map((p) => `${p}: ${value}`)
  }

  return null
}

/**
 * Synthétise la règle qui donne un effet visuel à une classe Tailwind (avec variants
 * éventuels) même si le CSS de la page ne la définit pas (build de production purgé qui n'a
 * jamais utilisé cette classe) : déclarations depuis notre taxonomie + le thème par défaut,
 * avec `!important`, pour prévisualiser n'importe quelle valeur. La page n'injecte ce CSS que si
 * aucune règle réelle n'existe (on préfère toujours le vrai CSS du site, plus fidèle à son
 * thème effectif). `null` si la classe n'est pas synthétisable.
 *
 * `dark:` produit systématiquement DEUX règles (`@media (prefers-color-scheme: dark)` ET
 * `:where(.dark, .dark *)`) plutôt que de deviner la stratégie du site (fiable, sans
 * heuristique DOM) : si le site n'utilise pas Tailwind dark mode, les deux restent inertes. La
 * page les ordonne selon la stratégie active (cf. content/live-injection.ts).
 */
export function buildLiveRule(fullClassName: string, sitePrefix: string | null, breakpoints: BreakpointMap = DEFAULT_BREAKPOINTS): LiveRule | null {
  const { variants, base } = splitVariants(fullClassName)

  // Déclarations vérifiées une à une (`CSS.supports`) : une valeur arbitraire invalide ou piégée
  // (`;`, `}`...) est écartée ici ; s'il n'en reste aucune, la classe n'aura pas d'effet.
  const decls = filterSupportedDeclarations(declarationsFor(base, sitePrefix) ?? [])
  if (decls.length === 0) return null

  const plan = planVariants(variants, breakpoints)
  if (!plan) return null

  // CSS.escape natif : échappe TOUT ce qui est invalide dans un identifiant (`( ) , ' " ! + * =`,
  // chiffre en tête...), là où un échappement maison oubliait toujours un cas.
  const selector = `${plan.selectorPrefix}.${CSS.escape(fullClassName)}${plan.selectorSuffix}`
  const importantDecls = decls.map((d) => `${d} !important`).join('; ')

  if (!plan.hasDark) return { rules: [wrapMedia(`${selector} { ${importantDecls}; }`, plan.mediaQueries)], dark: false }

  const mediaRule = wrapMedia(`${selector} { ${importantDecls}; }`, ['(prefers-color-scheme: dark)', ...plan.mediaQueries])
  const classRule = wrapMedia(`${selector}:where(.dark, .dark *) { ${importantDecls}; }`, plan.mediaQueries)
  return { rules: [mediaRule, classRule], dark: true }
}
