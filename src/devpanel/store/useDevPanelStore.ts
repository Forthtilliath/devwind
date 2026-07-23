import { create } from 'zustand'
import { DEVWIND_SYNC_PORT } from '../../types'
import type { AncestorInfo, ClassChangeRequest, CssScanResult, NavigateDirection, SyncFromContent, SyncFromPanel } from '../../types'

function getTargetTabId(): number {
  const raw = new URLSearchParams(window.location.search).get('tabId')
  const id = raw ? Number(raw) : NaN
  if (Number.isNaN(id)) throw new Error("DevWind : paramètre 'tabId' manquant dans l'URL du panneau.")
  return id
}

// Le Port de sync est gardé hors du state React (comme `selectedEl` l'était côté content
// script) : ce n'est pas une donnée à re-render, juste un canal de communication.
let port: chrome.runtime.Port | null = null

export type ConnectionState = 'connecting' | 'connected' | 'disconnected'

interface DevPanelState {
  connectionState: ConnectionState
  tagName: string | null
  activeClasses: string[]
  /** Du parent direct jusqu'à `<body>` : fil d'ariane pour remonter sans re-cliquer sur la page. */
  ancestors: AncestorInfo[]
  customScan: CssScanResult | null
  search: string
  /** Contexte de variant courant (ex. ['md','hover']) : appliqué à toute nouvelle édition. */
  activeVariants: string[]
  /** Verrouillé : le picker ne réagit plus au survol/clic sur la page (on peut interagir avec
   * la page normalement), la sélection ne change plus que via le fil d'ariane / le clavier. */
  locked: boolean

  connect: () => void
  applyChange: (request: ClassChangeRequest) => void
  removeClass: (rawClass: string) => void
  toggleClass: (rawClass: string) => void
  runCssScan: () => void
  setSearch: (query: string) => void
  toggleVariant: (variant: string) => void
  selectAncestor: (index: number) => void
  navigate: (direction: NavigateDirection) => void
  toggleLocked: () => void
}

function send(message: SyncFromPanel) {
  port?.postMessage(message)
}

export const useDevPanelStore = create<DevPanelState>((set, get) => ({
  connectionState: 'connecting',
  tagName: null,
  activeClasses: [],
  ancestors: [],
  customScan: null,
  search: '',
  activeVariants: [],
  locked: false,

  connect: () => {
    if (port) return // déjà connecté (StrictMode peut monter deux fois en dev)
    const p = chrome.tabs.connect(getTargetTabId(), { name: DEVWIND_SYNC_PORT })
    port = p
    set({ connectionState: 'connected' })

    p.onMessage.addListener((message: SyncFromContent) => {
      switch (message.type) {
        case 'ELEMENT_SELECTED':
          set({ tagName: message.tagName, activeClasses: message.classes, ancestors: message.ancestors })
          return
        case 'ELEMENT_CLEARED':
          set({ tagName: null, activeClasses: [], ancestors: [] })
          return
        case 'CLASSES_UPDATED':
          set({ activeClasses: message.classes })
          return
        case 'CUSTOM_SCAN_RESULT':
          set({ customScan: { found: new Map(message.found), unscannable: message.unscannable } })
          return
      }
    })

    p.onDisconnect.addListener(() => {
      port = null
      set({ connectionState: 'disconnected' })
    })
  },

  applyChange: (request) => send({ type: 'APPLY_CHANGE', request }),
  removeClass: (rawClass) => send({ type: 'REMOVE_CLASS', rawClass }),
  toggleClass: (rawClass) => send({ type: 'TOGGLE_CLASS', rawClass }),
  runCssScan: () => {
    if (get().customScan) return
    send({ type: 'RUN_CSS_SCAN' })
  },
  setSearch: (query) => set({ search: query }),
  toggleVariant: (variant) =>
    set((s) => ({
      activeVariants: s.activeVariants.includes(variant)
        ? s.activeVariants.filter((v) => v !== variant)
        : [...s.activeVariants, variant],
    })),
  selectAncestor: (index) => send({ type: 'SELECT_ANCESTOR', index }),
  navigate: (direction) => send({ type: 'NAVIGATE', direction }),
  toggleLocked: () =>
    set((s) => {
      const locked = !s.locked
      send({ type: 'SET_LOCKED', locked })
      return { locked }
    }),
}))
