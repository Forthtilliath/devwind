// --- Propriétés composites (scale / translate / skew / filter / backdrop-filter) ---
//
// Tailwind combine plusieurs classes indépendantes sur une même propriété via des variables CSS
// partagées (ex. `scale-105` et `skew-y-3` doivent affecter leurs propriétés respectives sans
// s'écraser si une troisième classe les recombine). Chaque classe composite pose SA variable ET
// réaffirme la formule complète de la propriété partagée — exactement le CSS que Tailwind génère
// lui-même. Fallback (`var(--x, defaut)`) dans chaque référence pour rester correct même sur un
// site sans preflight Tailwind. NOTE v4 (vérifié) : `rotate`/`scale`/`translate` sont maintenant
// des propriétés CSS natives séparées (plus un seul `transform` composite comme en v3) — seul
// `skew` reste sur `transform` (CSS n'a pas de propriété `skew` native). `rotate` n'a donc plus
// besoin d'être composite du tout (voir son entrée directe dans taxonomy.ts, propriété `rotate`).
function transformFormula(): string {
  return 'var(--tw-skew-x,) var(--tw-skew-y,)'
}

const FILTER_VARS = ['--tw-blur', '--tw-brightness', '--tw-contrast', '--tw-grayscale', '--tw-hue-rotate', '--tw-invert', '--tw-saturate', '--tw-sepia', '--tw-drop-shadow']
function filterFormula(): string {
  return FILTER_VARS.map((v) => `var(${v},)`).join(' ')
}

const BACKDROP_FILTER_VARS = ['--tw-backdrop-blur', '--tw-backdrop-brightness', '--tw-backdrop-contrast', '--tw-backdrop-grayscale', '--tw-backdrop-hue-rotate', '--tw-backdrop-invert', '--tw-backdrop-opacity', '--tw-backdrop-saturate', '--tw-backdrop-sepia']
function backdropFilterFormula(): string {
  return BACKDROP_FILTER_VARS.map((v) => `var(${v},)`).join(' ')
}

export interface CompositeSpec {
  /** Variables CSS que CE préfixe pose (2 pour `scale` bare : scale-x ET scale-y). */
  cssVars: string[]
  /** Enrobe la valeur dans la fonction attendue (`skewX(3deg)`), ou identité si la formule
   * partagée utilise déjà la valeur brute (`scale`/`translate`, propriétés natives). */
  wrap: (value: string) => string
  property: string
  formula: () => string
}

export const COMPOSITE_BY_PREFIX: Record<string, CompositeSpec> = {
  scale: { cssVars: ['--tw-scale-x', '--tw-scale-y'], wrap: (v) => v, property: 'scale', formula: () => 'var(--tw-scale-x, 1) var(--tw-scale-y, 1)' },
  'scale-x': { cssVars: ['--tw-scale-x'], wrap: (v) => v, property: 'scale', formula: () => 'var(--tw-scale-x, 1) var(--tw-scale-y, 1)' },
  'scale-y': { cssVars: ['--tw-scale-y'], wrap: (v) => v, property: 'scale', formula: () => 'var(--tw-scale-x, 1) var(--tw-scale-y, 1)' },
  'translate-x': { cssVars: ['--tw-translate-x'], wrap: (v) => v, property: 'translate', formula: () => 'var(--tw-translate-x, 0) var(--tw-translate-y, 0)' },
  'translate-y': { cssVars: ['--tw-translate-y'], wrap: (v) => v, property: 'translate', formula: () => 'var(--tw-translate-x, 0) var(--tw-translate-y, 0)' },
  'skew-x': { cssVars: ['--tw-skew-x'], wrap: (v) => `skewX(${v})`, property: 'transform', formula: transformFormula },
  'skew-y': { cssVars: ['--tw-skew-y'], wrap: (v) => `skewY(${v})`, property: 'transform', formula: transformFormula },

  blur: { cssVars: ['--tw-blur'], wrap: (v) => (v ? `blur(${v})` : ''), property: 'filter', formula: filterFormula },
  brightness: { cssVars: ['--tw-brightness'], wrap: (v) => `brightness(${v})`, property: 'filter', formula: filterFormula },
  contrast: { cssVars: ['--tw-contrast'], wrap: (v) => `contrast(${v})`, property: 'filter', formula: filterFormula },
  grayscale: { cssVars: ['--tw-grayscale'], wrap: (v) => `grayscale(${v})`, property: 'filter', formula: filterFormula },
  'hue-rotate': { cssVars: ['--tw-hue-rotate'], wrap: (v) => `hue-rotate(${v})`, property: 'filter', formula: filterFormula },
  invert: { cssVars: ['--tw-invert'], wrap: (v) => `invert(${v})`, property: 'filter', formula: filterFormula },
  saturate: { cssVars: ['--tw-saturate'], wrap: (v) => `saturate(${v})`, property: 'filter', formula: filterFormula },
  sepia: { cssVars: ['--tw-sepia'], wrap: (v) => `sepia(${v})`, property: 'filter', formula: filterFormula },

  'backdrop-blur': { cssVars: ['--tw-backdrop-blur'], wrap: (v) => (v ? `blur(${v})` : ''), property: 'backdrop-filter', formula: backdropFilterFormula },
  'backdrop-brightness': { cssVars: ['--tw-backdrop-brightness'], wrap: (v) => `brightness(${v})`, property: 'backdrop-filter', formula: backdropFilterFormula },
  'backdrop-contrast': { cssVars: ['--tw-backdrop-contrast'], wrap: (v) => `contrast(${v})`, property: 'backdrop-filter', formula: backdropFilterFormula },
  'backdrop-grayscale': { cssVars: ['--tw-backdrop-grayscale'], wrap: (v) => `grayscale(${v})`, property: 'backdrop-filter', formula: backdropFilterFormula },
  'backdrop-hue-rotate': { cssVars: ['--tw-backdrop-hue-rotate'], wrap: (v) => `hue-rotate(${v})`, property: 'backdrop-filter', formula: backdropFilterFormula },
  'backdrop-invert': { cssVars: ['--tw-backdrop-invert'], wrap: (v) => `invert(${v})`, property: 'backdrop-filter', formula: backdropFilterFormula },
  'backdrop-opacity': { cssVars: ['--tw-backdrop-opacity'], wrap: (v) => `opacity(${v})`, property: 'backdrop-filter', formula: backdropFilterFormula },
  'backdrop-saturate': { cssVars: ['--tw-backdrop-saturate'], wrap: (v) => `saturate(${v})`, property: 'backdrop-filter', formula: backdropFilterFormula },
  'backdrop-sepia': { cssVars: ['--tw-backdrop-sepia'], wrap: (v) => `sepia(${v})`, property: 'backdrop-filter', formula: backdropFilterFormula },
}

export function compositeDeclarations(spec: CompositeSpec, value: string): string[] {
  const varDecls = spec.cssVars.map((v) => `${v}: ${spec.wrap(value)}`)
  // -webkit-backdrop-filter en plus (vérifié dans la sortie réelle v4) : coût nul, meilleure fidélité.
  const propDecls = spec.property === 'backdrop-filter' ? [`-webkit-backdrop-filter: ${spec.formula()}`, `${spec.property}: ${spec.formula()}`] : [`${spec.property}: ${spec.formula()}`]
  return [...varDecls, ...propDecls]
}
