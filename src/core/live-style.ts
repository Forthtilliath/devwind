import { taxonomy } from '../data/taxonomy'
import generatedClasses from '../data/generated/tailwind-v3-classes.json'
import { hasRuleForClass } from './css-scanner'
import type { GeneratedClass } from '../types'

const GENERATED_BY_CLASSNAME = new Map<string, GeneratedClass>()
for (const c of generatedClasses as GeneratedClass[]) GENERATED_BY_CLASSNAME.set(c.className, c)

const STYLE_ELEMENT_ID = 'devwind-live-styles'
const injected = new Set<string>()

function getStyleEl(): HTMLStyleElement {
  let el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = STYLE_ELEMENT_ID
    document.head.appendChild(el)
  }
  return el
}

/** Échappe un nom de classe Tailwind pour l'utiliser comme sélecteur CSS littéral. */
function cssEscape(className: string): string {
  return className.replace(/([:/[\].%#])/g, '\\$1')
}

/**
 * Détermine les déclarations CSS (`propriété: valeur`) d'une classe "base" (sans variants),
 * à partir de la taxonomie + du dataset généré (classes connues) ou en parsant directement
 * une valeur arbitraire (`bg-[#ff0000]`, non présente dans le dataset généré).
 */
function declarationsFor(base: string): string[] | null {
  const generated = GENERATED_BY_CLASSNAME.get(base)
  if (generated) {
    const entry = taxonomy.find((e) => e.id === generated.taxonomyId)
    const props = entry?.cssProperties[generated.prefix]
    if (!entry || !props) return null
    if (entry.type === 'static') {
      const value = generated.prefix ? base.slice(generated.prefix.length + 1) : base
      return props.map((p) => `${p}: ${value}`)
    }
    if (!generated.themeToken) return null
    const value = generated.negative ? `-${generated.themeToken}` : generated.themeToken
    return props.map((p) => `${p}: ${value}`)
  }

  const arbitraryMatch = /^(-?)([a-z][a-z-]*)-\[(.+)\]$/.exec(base)
  if (arbitraryMatch) {
    const [, neg, prefix, rawValue] = arbitraryMatch
    const entry = taxonomy.find((e) => e.prefixes.includes(prefix) && e.supportsArbitrary)
    const props = entry?.cssProperties[prefix]
    if (!props) return null
    return props.map((p) => `${p}: ${neg}${rawValue}`)
  }

  return null
}

// min-width standard des breakpoints Tailwind par défaut (sm/md/lg/xl/2xl) : suffisant pour
// synthétiser un `@media` fidèle sans dépendre du thème du site (les breakpoints sont rarement
// personnalisés, contrairement aux couleurs/spacing).
const BREAKPOINTS: Record<string, number> = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 }

// Pseudo-classes simples, non ambiguës (contrairement à `dark:`, dont la stratégie réelle du
// site — media query vs classe `.dark` — n'est pas déterminable de façon fiable).
const SIMPLE_PSEUDO: Record<string, string> = {
  hover: ':hover',
  focus: ':focus',
  'focus-visible': ':focus-visible',
  'focus-within': ':focus-within',
  active: ':active',
  disabled: ':disabled',
  first: ':first-child',
  last: ':last-child',
  odd: ':nth-child(odd)',
  even: ':nth-child(even)',
  visited: ':visited',
}

/**
 * Garantit qu'une classe Tailwind (avec variants éventuels) a un effet visuel même si le CSS
 * de la page ne la définit pas (build de production purgé qui n'a jamais utilisé cette
 * classe) : synthétise la règle depuis notre taxonomie + le thème par défaut et l'injecte
 * avec `!important`, pour permettre de prévisualiser n'importe quelle valeur à tout moment,
 * même si elle n'existe pas "en vrai" sur le site. Ne fait rien si une règle réelle existe
 * déjà (on préfère toujours le vrai CSS du site, plus fidèle à son thème effectif, à notre
 * approximation par défaut) — ni pour les variants ambigus (`dark:`, `group-*`, `aria-*`...)
 * qu'on ne peut pas reproduire fidèlement sans connaître la stratégie du site.
 */
export function ensureLiveRule(fullClassName: string): void {
  if (injected.has(fullClassName)) return
  if (hasRuleForClass(fullClassName, document, STYLE_ELEMENT_ID)) return

  const parts = fullClassName.split(':')
  const base = parts[parts.length - 1]
  const variants = parts.slice(0, -1)

  const decls = declarationsFor(base)
  if (!decls) return

  let selector = `.${cssEscape(fullClassName)}`
  const mediaQueries: string[] = []
  for (const v of variants) {
    if (BREAKPOINTS[v] != null) {
      mediaQueries.push(`(min-width: ${BREAKPOINTS[v]}px)`)
    } else if (v.startsWith('max-') && BREAKPOINTS[v.slice(4)] != null) {
      mediaQueries.push(`(max-width: ${BREAKPOINTS[v.slice(4)] - 1}px)`)
    } else if (SIMPLE_PSEUDO[v]) {
      selector += SIMPLE_PSEUDO[v]
    } else {
      return // variant non géré de façon fiable (dark, group-*, aria-*, has-*...)
    }
  }

  let rule = `${selector} { ${decls.map((d) => `${d} !important`).join('; ')}; }`
  for (const mq of mediaQueries) rule = `@media ${mq} { ${rule} }`

  getStyleEl().appendChild(document.createTextNode(`${rule}\n`))
  injected.add(fullClassName)
}
