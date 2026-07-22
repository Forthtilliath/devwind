// Protocole de messages entre popup et content script.
export type PickerMessage =
  | { type: 'DEVWIND_PING' }
  | { type: 'DEVWIND_GET_STATE' }
  | { type: 'DEVWIND_SET_ACTIVE'; active: boolean }

export interface PickerState {
  active: boolean
}

// --- Taxonomie Tailwind ---

export type TaxonomyValueType = 'scale' | 'color' | 'static' | 'boolean'

export interface TaxonomyEntry {
  id: string
  category: string
  subcategory?: string
  /** préfixe de classe -> propriétés CSS affectées (pour affichage/documentation) */
  cssProperties: Record<string, string[]>
  prefixes: string[]
  themeKey: string | null
  type: TaxonomyValueType
  staticValues?: string[]
  supportsArbitrary: boolean
  supportsNegative: boolean
}

export interface GeneratedClass {
  className: string
  taxonomyId: string
  category: string
  subcategory?: string
  themeKey: string | null
  themeToken: string | null
  negative: boolean
}

// --- Parsing / diff de classes ---

export interface ParsedClass {
  raw: string
  variants: string[]
  base: string
}

export interface VariantContext {
  breakpoint: string | null
  pseudo: string[]
}

// --- Scan CSS ---

export interface CustomClassInfo {
  className: string
  sources: string[]
}

export interface CssScanResult {
  found: Map<string, string[]>
  unscannable: string[]
}
