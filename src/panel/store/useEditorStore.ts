import { create } from 'zustand'
import { addRawClass, applyClassChange, removeRawClass, type ClassChangeRequest } from '../../core/class-diff'
import { scanCustomClasses } from '../../core/css-scanner'
import type { CssScanResult } from '../../types'

// Le nœud DOM sélectionné est gardé hors du store React (jamais sérialisé/re-rendu par Zustand) :
// seul un id monotone (`selectedElementId`) vit dans le state pour déclencher les re-renders.
let selectedEl: Element | null = null
let nextSelectionId = 0

export function getSelectedElement(): Element | null {
  return selectedEl
}

interface EditorState {
  pickerActive: boolean
  selectedElementId: number | null
  activeClasses: string[]
  customScan: CssScanResult | null
  search: string

  setPickerActive: (active: boolean) => void
  selectElement: (el: Element | null) => void
  applyChange: (request: ClassChangeRequest) => void
  removeClass: (rawClass: string) => void
  toggleClass: (rawClass: string) => void
  setSearch: (query: string) => void
  runCssScan: () => void
}

function readClasses(el: Element | null): string[] {
  if (!el) return []
  return el.className.toString().split(/\s+/).filter(Boolean)
}

export const useEditorStore = create<EditorState>((set, get) => ({
  pickerActive: false,
  selectedElementId: null,
  activeClasses: [],
  customScan: null,
  search: '',

  setPickerActive: (active) => set({ pickerActive: active }),

  selectElement: (el) => {
    selectedEl = el
    set({ selectedElementId: el ? nextSelectionId++ : null, activeClasses: readClasses(el) })
  },

  applyChange: (request) => {
    if (!selectedEl) return
    applyClassChange(selectedEl, request)
    set({ activeClasses: readClasses(selectedEl) })
  },

  removeClass: (rawClass) => {
    if (!selectedEl) return
    removeRawClass(selectedEl, rawClass)
    set({ activeClasses: readClasses(selectedEl) })
  },

  toggleClass: (rawClass) => {
    if (!selectedEl) return
    if (get().activeClasses.includes(rawClass)) removeRawClass(selectedEl, rawClass)
    else addRawClass(selectedEl, rawClass)
    set({ activeClasses: readClasses(selectedEl) })
  },

  setSearch: (query) => set({ search: query }),

  runCssScan: () => {
    if (get().customScan) return
    set({ customScan: scanCustomClasses() })
  },
}))
