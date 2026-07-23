import { addRawClass, applyClassChange, removeRawClass } from '../core/class-diff'
import { scanCustomClasses } from '../core/css-scanner'
import { DEVWIND_SYNC_PORT } from '../types'
import type { SyncFromContent, SyncFromPanel } from '../types'

// Élément actuellement sélectionné par le picker, gardé hors de tout state React/store
// (c'est le content script qui a l'accès DOM réel ; la fenêtre devpanel ne voit que les
// classes qu'on lui envoie via le Port).
let selectedEl: Element | null = null
let port: chrome.runtime.Port | null = null

function readClasses(el: Element): string[] {
  return el.className.toString().split(/\s+/).filter(Boolean)
}

function send(message: SyncFromContent) {
  port?.postMessage(message)
}

function handlePanelMessage(message: SyncFromPanel) {
  switch (message.type) {
    case 'APPLY_CHANGE': {
      if (!selectedEl) return
      applyClassChange(selectedEl, message.request)
      send({ type: 'CLASSES_UPDATED', classes: readClasses(selectedEl) })
      return
    }
    case 'REMOVE_CLASS': {
      if (!selectedEl) return
      removeRawClass(selectedEl, message.rawClass)
      send({ type: 'CLASSES_UPDATED', classes: readClasses(selectedEl) })
      return
    }
    case 'TOGGLE_CLASS': {
      if (!selectedEl) return
      const current = readClasses(selectedEl)
      if (current.includes(message.rawClass)) removeRawClass(selectedEl, message.rawClass)
      else addRawClass(selectedEl, message.rawClass)
      send({ type: 'CLASSES_UPDATED', classes: readClasses(selectedEl) })
      return
    }
    case 'RUN_CSS_SCAN': {
      const result = scanCustomClasses()
      send({ type: 'CUSTOM_SCAN_RESULT', found: Array.from(result.found.entries()), unscannable: result.unscannable })
      return
    }
  }
}

export interface SetupSyncOptions {
  onPortConnected: () => void
  onPortDisconnected: () => void
}

/** Écoute la connexion de la fenêtre devpanel (Port nommé DEVWIND_SYNC_PORT). */
export function setupSync({ onPortConnected, onPortDisconnected }: SetupSyncOptions) {
  chrome.runtime.onConnect.addListener((p) => {
    if (p.name !== DEVWIND_SYNC_PORT) return
    port = p
    onPortConnected()
    if (selectedEl) send({ type: 'ELEMENT_SELECTED', tagName: selectedEl.tagName.toLowerCase(), classes: readClasses(selectedEl) })

    p.onMessage.addListener(handlePanelMessage)
    p.onDisconnect.addListener(() => {
      if (port === p) port = null
      onPortDisconnected()
    })
  })
}

/** Appelé par le picker quand l'utilisateur sélectionne un élément de la page. */
export function selectElement(el: Element | null) {
  selectedEl = el
  if (!el) {
    send({ type: 'ELEMENT_CLEARED' })
    return
  }
  send({ type: 'ELEMENT_SELECTED', tagName: el.tagName.toLowerCase(), classes: readClasses(el) })
}
