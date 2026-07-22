import { matchTaxonomy, splitVariants } from './class-parser'
import type { CssScanResult } from '../types'

/**
 * Sélecteur de classe CSS, en gérant les caractères échappés (`\:`, `\/`, `\[`, `\]`, `\.`...)
 * que Tailwind génère pour les variants/valeurs arbitraires dans le sélecteur compilé
 * (ex. `.hover\:bg-red-500:hover`, `.w-\[100px\]`). Un caractère normal OU un backslash
 * suivi de n'importe quel caractère sont acceptés ; on s'arrête au premier caractère
 * "non échappé" qui ne fait pas partie d'un nom de classe (`:`, ` `, `.`, `>`, `[`...).
 */
const CLASS_SELECTOR_RE = /\.((?:[A-Za-z0-9_-]|\\.)+)/g

function unescapeCssIdent(raw: string): string {
  return raw.replace(/\\(.)/g, '$1')
}

function isRecognizedTailwindClass(className: string): boolean {
  const { base } = splitVariants(className)
  return matchTaxonomy(base) !== null
}

function extractClassSelectors(selectorText: string): string[] {
  const out: string[] = []
  for (const m of selectorText.matchAll(CLASS_SELECTOR_RE)) {
    out.push(unescapeCssIdent(m[1]))
  }
  return out
}

function isRuleWithSelector(rule: CSSRule): rule is CSSStyleRule {
  return 'selectorText' in rule
}

function isGroupingRule(rule: CSSRule): rule is CSSMediaRule | CSSSupportsRule {
  return 'cssRules' in rule
}

/**
 * `isRuleWithSelector` et `isGroupingRule` ne sont PAS mutuellement exclusifs : depuis le
 * support natif du CSS Nesting, un `CSSStyleRule` a lui aussi une propriété `cssRules`
 * (liste vide si aucune règle imbriquée), en plus de son propre `selectorText`. Il faut donc
 * traiter le sélecteur de la règle ET recurser dans ses éventuelles règles imbriquées.
 */
function walkRules(rules: CSSRuleList, href: string | null, found: Map<string, string[]>) {
  for (const rule of Array.from(rules)) {
    if (isRuleWithSelector(rule)) {
      for (const cls of extractClassSelectors(rule.selectorText)) {
        if (isRecognizedTailwindClass(cls)) continue
        const sources = found.get(cls) ?? []
        if (!sources.includes(href ?? '(inline)')) sources.push(href ?? '(inline)')
        found.set(cls, sources)
      }
    }
    if (isGroupingRule(rule) && rule.cssRules.length > 0) {
      walkRules(rule.cssRules, href, found)
    }
  }
}

/**
 * Parcourt les feuilles de style chargées par la page pour en extraire les classes
 * "custom" (non reconnues comme Tailwind). Les feuilles cross-origin sans CORS lèvent
 * une SecurityError sur `cssRules` et sont listées comme non scannables (Phase A :
 * pas de fallback fetch, ajouté en Phase B).
 */
export function scanCustomClasses(doc: Document = document): CssScanResult {
  const found = new Map<string, string[]>()
  const unscannable: string[] = []

  for (const sheet of Array.from(doc.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      unscannable.push(sheet.href ?? '(inline)')
      continue
    }
    if (rules) walkRules(rules, sheet.href, found)
  }

  return { found, unscannable }
}
