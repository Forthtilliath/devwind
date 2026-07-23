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
  /** préfixe utilisé pour générer cette classe (ex. 'px' pour `px-4`, '' pour `flex`) */
  prefix: string
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

export interface ClassChangeRequest {
  /** id de l'entrée taxonomy.ts concernée (ex. 'padding') */
  taxonomyId: string
  /** préfixe exact concerné (ex. 'pt' pour padding-top, '' si l'entrée n'en a qu'un) — les
   * entrées à préfixes multiples (padding/margin/gap) ont un slot par côté, pas un slot
   * global pour toute l'entrée : changer `pt-8` ne doit pas retirer `px-3`. */
  prefix: string
  /** contexte de variant courant (ex. ['md','hover']), [] pour la classe de base */
  variants: string[]
  /** nouvelle classe de base à appliquer (ex. 'bg-red-500'), ou null pour retirer le slot */
  newBase: string | null
}

export interface ClassChangeResult {
  before: string
  after: string
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

// --- Synchronisation content script <-> fenêtre devpanel (via chrome.runtime.Port) ---

export const DEVWIND_SYNC_PORT = 'devwind-sync'

/** Messages envoyés par le content script vers la fenêtre devpanel connectée. */
export type SyncFromContent =
  | { type: 'ELEMENT_SELECTED'; tagName: string; classes: string[] }
  | { type: 'ELEMENT_CLEARED' }
  | { type: 'CLASSES_UPDATED'; classes: string[] }
  | { type: 'CUSTOM_SCAN_RESULT'; found: [string, string[]][]; unscannable: string[] }

/** Messages envoyés par la fenêtre devpanel vers le content script. */
export type SyncFromPanel =
  | { type: 'APPLY_CHANGE'; request: ClassChangeRequest }
  | { type: 'REMOVE_CLASS'; rawClass: string }
  | { type: 'TOGGLE_CLASS'; rawClass: string }
  | { type: 'RUN_CSS_SCAN' }
