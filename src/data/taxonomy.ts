import type { TaxonomyEntry } from '../types'

/**
 * Table hand-authored : une entrée par "plugin" Tailwind (~90 à terme, cf. Phase B).
 * C'est ici qu'on investit le soin sur l'organisation du panneau — pas dans la liste
 * des classes elle-même (générée, voir scripts/generate-tailwind-data.ts).
 *
 * `prefixes: ['']` signifie que la classe est la valeur elle-même, sans tiret de préfixe
 * (ex. `display`: la classe `flex` est directement `flex`, pas `flex-flex`).
 *
 * Phase A : Spacing, Couleurs (bg/text/border), Typography (taille/poids/alignement),
 * Layout (display/position). Le reste des ~90 entrées arrive en Phase B.
 */
export const taxonomy: TaxonomyEntry[] = [
  // --- Spacing ---
  {
    id: 'padding',
    category: 'Spacing',
    subcategory: 'Padding',
    prefixes: ['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl'],
    cssProperties: {
      p: ['padding'],
      px: ['padding-left', 'padding-right'],
      py: ['padding-top', 'padding-bottom'],
      pt: ['padding-top'],
      pr: ['padding-right'],
      pb: ['padding-bottom'],
      pl: ['padding-left'],
    },
    themeKey: 'spacing',
    type: 'scale',
    supportsArbitrary: true,
    supportsNegative: false,
  },
  {
    id: 'margin',
    category: 'Spacing',
    subcategory: 'Margin',
    prefixes: ['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml'],
    cssProperties: {
      m: ['margin'],
      mx: ['margin-left', 'margin-right'],
      my: ['margin-top', 'margin-bottom'],
      mt: ['margin-top'],
      mr: ['margin-right'],
      mb: ['margin-bottom'],
      ml: ['margin-left'],
    },
    themeKey: 'spacing',
    type: 'scale',
    supportsArbitrary: true,
    supportsNegative: true,
  },
  {
    id: 'gap',
    category: 'Spacing',
    subcategory: 'Gap',
    prefixes: ['gap', 'gap-x', 'gap-y'],
    cssProperties: {
      gap: ['gap'],
      'gap-x': ['column-gap'],
      'gap-y': ['row-gap'],
    },
    themeKey: 'spacing',
    type: 'scale',
    supportsArbitrary: true,
    supportsNegative: false,
  },

  // --- Couleurs ---
  {
    id: 'backgroundColor',
    category: 'Couleurs',
    subcategory: 'Background',
    prefixes: ['bg'],
    cssProperties: { bg: ['background-color'] },
    themeKey: 'colors',
    type: 'color',
    supportsArbitrary: true,
    supportsNegative: false,
  },
  {
    id: 'textColor',
    category: 'Couleurs',
    subcategory: 'Texte',
    prefixes: ['text'],
    cssProperties: { text: ['color'] },
    themeKey: 'colors',
    type: 'color',
    supportsArbitrary: true,
    supportsNegative: false,
  },
  {
    id: 'borderColor',
    category: 'Couleurs',
    subcategory: 'Border',
    prefixes: ['border'],
    cssProperties: { border: ['border-color'] },
    themeKey: 'colors',
    type: 'color',
    supportsArbitrary: true,
    supportsNegative: false,
  },

  // --- Typography ---
  {
    id: 'fontSize',
    category: 'Typography',
    subcategory: 'Taille',
    prefixes: ['text'],
    cssProperties: { text: ['font-size', 'line-height'] },
    themeKey: 'fontSize',
    type: 'scale',
    supportsArbitrary: true,
    supportsNegative: false,
  },
  {
    id: 'fontWeight',
    category: 'Typography',
    subcategory: 'Poids',
    prefixes: ['font'],
    cssProperties: { font: ['font-weight'] },
    themeKey: 'fontWeight',
    type: 'scale',
    supportsArbitrary: false,
    supportsNegative: false,
  },
  {
    id: 'textAlign',
    category: 'Typography',
    subcategory: 'Alignement',
    prefixes: ['text'],
    cssProperties: { text: ['text-align'] },
    themeKey: null,
    type: 'static',
    staticValues: ['left', 'center', 'right', 'justify', 'start', 'end'],
    supportsArbitrary: false,
    supportsNegative: false,
  },

  // --- Layout ---
  {
    id: 'display',
    category: 'Layout',
    subcategory: 'Display',
    prefixes: [''],
    cssProperties: { '': ['display'] },
    themeKey: null,
    type: 'static',
    staticValues: [
      'block',
      'inline-block',
      'inline',
      'flex',
      'inline-flex',
      'grid',
      'inline-grid',
      'table',
      'hidden',
    ],
    supportsArbitrary: false,
    supportsNegative: false,
  },
  {
    id: 'position',
    category: 'Layout',
    subcategory: 'Position',
    prefixes: [''],
    cssProperties: { '': ['position'] },
    themeKey: null,
    type: 'static',
    staticValues: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
    supportsArbitrary: false,
    supportsNegative: false,
  },
]
