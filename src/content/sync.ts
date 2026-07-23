import { addRawClass, applyClassChange, removeRawClass } from '../core/class-diff'
import { scanCustomClasses, watchForStylesheetChanges } from '../core/css-scanner'
import { ensureLiveRule } from '../core/live-style'
import { DEVWIND_SYNC_PORT } from '../types'
import type { AncestorInfo, ElementColors, SyncFromContent, SyncFromPanel } from '../types'

// Élément actuellement sélectionné + chaîne de ses ancêtres (fil d'ariane), gardés hors de
// tout state React/store (c'est le content script qui a l'accès DOM réel ; la fenêtre devpanel
// ne voit que les classes/ancêtres qu'on lui envoie via le Port).
let selectedEl: Element | null = null
let ancestorElements: Element[] = []
let port: chrome.runtime.Port | null = null
let stopWatchingStylesheets: (() => void) | null = null

const MAX_ANCESTORS = 8

function readClasses(el: Element): string[] {
  return el.className.toString().split(/\s+/).filter(Boolean)
}

function describeAncestor(el: Element): AncestorInfo {
  return { tagName: el.tagName.toLowerCase(), id: el.id || null, classes: readClasses(el) }
}

/** Du parent direct jusqu'à `<body>` inclus, plafonné pour éviter un fil d'ariane interminable
 * sur des pages très imbriquées. */
function computeAncestors(el: Element): Element[] {
  const chain: Element[] = []
  let current = el.parentElement
  while (current && chain.length < MAX_ANCESTORS) {
    chain.push(current)
    if (current === document.body) break
    current = current.parentElement
  }
  return chain
}

function isTransparent(color: string): boolean {
  const m = /rgba\([^)]+,\s*([\d.]+)\)/.exec(color)
  return color === 'transparent' || (m != null && Number(m[1]) === 0)
}

/** Couleur de fond effective : remonte les ancêtres tant que `background-color` est
 * transparent, pour refléter le fond réellement visible derrière l'élément plutôt qu'un
 * `rgba(0,0,0,0)` inutile au calcul de contraste. Blanc par défaut si toute la chaîne est
 * transparente (cas `<body>` sans fond explicite, comportement de rendu par défaut). */
function computeEffectiveColors(el: Element): ElementColors {
  const style = getComputedStyle(el)
  let bg = style.backgroundColor
  let current: Element | null = el
  while (current && isTransparent(bg)) {
    current = current.parentElement
    if (!current) break
    bg = getComputedStyle(current).backgroundColor
  }
  if (!bg || isTransparent(bg)) bg = 'rgb(255, 255, 255)'
  return {
    color: style.color,
    backgroundColor: bg,
    fontSize: parseFloat(style.fontSize),
    bold: Number(style.fontWeight) >= 700,
  }
}

function send(message: SyncFromContent) {
  port?.postMessage(message)
}

async function runCssScan() {
  const result = await scanCustomClasses()
  send({
    type: 'CUSTOM_SCAN_RESULT',
    found: Array.from(result.found.entries()),
    unscannable: result.unscannable,
    detectedPrefix: result.detectedPrefix,
  })
}

export interface SetupSyncOptions {
  onPortConnected: () => void
  onPortDisconnected: () => void
  /** Sélection changée (picker, fil d'ariane ou navigation clavier) : sert à synchroniser le
   * rectangle de surbrillance sur la page avec la sélection actuelle. */
  onSelectionChanged: (el: Element | null) => void
  onSetLocked: (locked: boolean) => void
}

let options: SetupSyncOptions | null = null

/** Centralise le changement de sélection (picker, fil d'ariane, clavier) : met à jour l'état,
 * recalcule les ancêtres, notifie la fenêtre devpanel ET le callback local (surbrillance). */
function setSelection(el: Element | null) {
  selectedEl = el
  ancestorElements = el ? computeAncestors(el) : []
  options?.onSelectionChanged(el)

  if (!el) {
    send({ type: 'ELEMENT_CLEARED' })
    return
  }
  send({
    type: 'ELEMENT_SELECTED',
    tagName: el.tagName.toLowerCase(),
    classes: readClasses(el),
    ancestors: ancestorElements.map(describeAncestor),
    colors: computeEffectiveColors(el),
  })
}

/** Recalcule les couleurs effectives à chaque changement de classes (une édition peut changer
 * le texte ET le fond, ou le fond d'un ancêtre remonté par `computeEffectiveColors`). */
function sendClassesUpdated(el: Element, unsupportedClass?: string | null) {
  send({ type: 'CLASSES_UPDATED', classes: readClasses(el), unsupportedClass, colors: computeEffectiveColors(el) })
}

function navigate(direction: 'parent' | 'child' | 'prev' | 'next') {
  if (!selectedEl) return
  const target =
    direction === 'parent'
      ? selectedEl.parentElement
      : direction === 'child'
        ? selectedEl.firstElementChild
        : direction === 'prev'
          ? selectedEl.previousElementSibling
          : selectedEl.nextElementSibling
  // On ne monte pas plus haut que <body> (sélectionner <html>/<body> entier n'aide pas à éditer).
  if (!target || target === document.documentElement) return
  setSelection(target)
}

function handlePanelMessage(message: SyncFromPanel) {
  switch (message.type) {
    case 'APPLY_CHANGE': {
      if (!selectedEl) return
      let unsupportedClass: string | null = null
      if (message.request.newBase) {
        const fullClassName = [...message.request.variants, message.request.newBase].join(':')
        if (ensureLiveRule(fullClassName) === 'unsupported') unsupportedClass = fullClassName
      }
      applyClassChange(selectedEl, message.request)
      sendClassesUpdated(selectedEl, unsupportedClass)
      return
    }
    case 'REMOVE_CLASS': {
      if (!selectedEl) return
      removeRawClass(selectedEl, message.rawClass)
      sendClassesUpdated(selectedEl)
      return
    }
    case 'TOGGLE_CLASS': {
      if (!selectedEl) return
      const current = readClasses(selectedEl)
      if (current.includes(message.rawClass)) removeRawClass(selectedEl, message.rawClass)
      else addRawClass(selectedEl, message.rawClass)
      sendClassesUpdated(selectedEl)
      return
    }
    case 'RUN_CSS_SCAN': {
      void runCssScan()
      return
    }
    case 'SELECT_ANCESTOR': {
      const target = ancestorElements[message.index]
      if (target) setSelection(target)
      return
    }
    case 'NAVIGATE': {
      navigate(message.direction)
      return
    }
    case 'SET_LOCKED': {
      options?.onSetLocked(message.locked)
      return
    }
  }
}

/** Écoute la connexion de la fenêtre devpanel (Port nommé DEVWIND_SYNC_PORT). */
export function setupSync(opts: SetupSyncOptions) {
  options = opts
  chrome.runtime.onConnect.addListener((p) => {
    if (p.name !== DEVWIND_SYNC_PORT) return
    port = p
    opts.onPortConnected()
    if (selectedEl) {
      send({
        type: 'ELEMENT_SELECTED',
        tagName: selectedEl.tagName.toLowerCase(),
        classes: readClasses(selectedEl),
        ancestors: ancestorElements.map(describeAncestor),
        colors: computeEffectiveColors(selectedEl),
      })
    }

    // Re-scanne automatiquement (debounced) si le site charge une feuille de style après coup
    // (route SPA, composant lazy-loadé...), pour ne pas laisser la liste "Custom" périmée tant
    // que la fenêtre devpanel reste ouverte.
    stopWatchingStylesheets?.()
    stopWatchingStylesheets = watchForStylesheetChanges(() => void runCssScan())

    p.onMessage.addListener(handlePanelMessage)
    p.onDisconnect.addListener(() => {
      if (port === p) port = null
      stopWatchingStylesheets?.()
      stopWatchingStylesheets = null
      opts.onPortDisconnected()
    })
  })
}

/** Appelé par le picker quand l'utilisateur sélectionne un élément de la page (clic). */
export function selectElement(el: Element | null) {
  setSelection(el)
}
