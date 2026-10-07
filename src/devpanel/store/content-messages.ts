import { isTailwindClass } from '../../core/class-parser'
import { pickSitePrefix } from '../../core/site-prefix'
import { breakpointsFromThemeVariables, breakpointsFromVotes, DEFAULT_BREAKPOINTS } from '../../core/breakpoints'
import { resolveFinalClasses } from './history'
import { MAX_CHANGE_LOG_ENTRIES } from '../../types'
import type { ChangeLogEntry, CssScanResult, SyncFromContent, SyncFromPanel } from '../../types'
import type { StoreApi } from 'zustand'
import type { DevPanelState } from './useDevPanelStore'

type SetState = StoreApi<DevPanelState>['setState']
type GetState = StoreApi<DevPanelState>['getState']

/** La page envoie toutes les classes de ses feuilles de style : on ne garde que les "custom". */
function customClassesOnly(found: [string, string[]][]): CssScanResult['found'] {
  return new Map(found.filter(([cls]) => !isTailwindClass(cls)))
}

function appendLogEntry(log: ChangeLogEntry[], entry: ChangeLogEntry): ChangeLogEntry[] {
  const next = [...log, entry]
  return next.length > MAX_CHANGE_LOG_ENTRIES ? next.slice(next.length - MAX_CHANGE_LOG_ENTRIES) : next
}

/** Breakpoints effectifs : défauts v4, puis variables de thème, puis media queries du CSS du
 * site (la trace la plus fiable, cf. core/breakpoint-scanner.ts) — la dernière source gagne. */
function mergeBreakpoints(s: Pick<DevPanelState, 'themeBreakpoints' | 'cssBreakpoints'>): DevPanelState['breakpoints'] {
  return { ...DEFAULT_BREAKPOINTS, ...s.themeBreakpoints, ...s.cssBreakpoints }
}

/** Applique au store un message (déjà validé) reçu du content script. */
export function handleContentMessage(message: SyncFromContent, set: SetState, get: GetState, send: (m: SyncFromPanel) => void) {
  switch (message.type) {
    case 'ELEMENT_SELECTED':
      set({
        tagName: message.tagName,
        selectionDetached: false,
        activeClasses: message.classes,
        ancestors: message.ancestors,
        unsupportedClasses: [],
        elementColors: message.colors,
      })
      return
    case 'ELEMENT_CLEARED':
      set({ tagName: null, selectionDetached: message.detached === true, activeClasses: [], ancestors: [], unsupportedClasses: [], elementColors: null })
      return
    case 'CLASSES_UPDATED':
      set((s) => {
        const kept = s.unsupportedClasses.filter((c) => message.classes.includes(c))
        if (message.unsupportedClass && !kept.includes(message.unsupportedClass)) kept.push(message.unsupportedClass)
        return { activeClasses: message.classes, unsupportedClasses: kept, elementColors: message.colors }
      })
      return
    case 'CUSTOM_SCAN_RESULT': {
      const cssBreakpoints = breakpointsFromVotes(message.breakpoints, get().sitePrefix)
      set((s) => ({
        customScan: { found: customClassesOnly(message.found), unscannable: message.unscannable },
        cssBreakpoints,
        breakpoints: mergeBreakpoints({ ...s, cssBreakpoints }),
      }))
      return
    }
    case 'PREFIX_CANDIDATES': {
      const sitePrefix = pickSitePrefix(message.candidates)
      if (sitePrefix === get().sitePrefix) return
      set({ sitePrefix })
      // Variables de thème déjà affichées : leurs noms dépendent du préfixe, on les relit.
      if (get().themeVariables) send({ type: 'RUN_THEME_SCAN', prefix: sitePrefix })
      return
    }
    case 'THEME_SCAN_RESULT': {
      const themeBreakpoints = breakpointsFromThemeVariables(message.variables, get().sitePrefix)
      set((s) => ({ themeVariables: message.variables, themeBreakpoints, breakpoints: mergeBreakpoints({ ...s, themeBreakpoints }) }))
      return
    }
    case 'CHANGE_LOG_RESET':
      set({ changeLog: message.entries })
      return
    case 'CHANGE_LOG_ENTRY':
      set((s) => ({ changeLog: appendLogEntry(s.changeLog, message.entry) }))
      return
    case 'CHANGE_LOG_ENTRY_UPDATED':
      set((s) => ({ changeLog: s.changeLog.map((e) => (e.id === message.entry.id ? message.entry : e)) }))
      return
    case 'REVERT_REJECTED':
      get().showNotice(message.reason === 'detached' ? 'notice.revertDetached' : 'notice.revertModified')
      return
    case 'FINAL_CLASSES':
      resolveFinalClasses(message.elements)
      return
    case 'LOCKED_CHANGED':
      // Verrouillage déclenché depuis la page (Échap sur le picker), pas depuis le bouton
      // du panneau : rien à renvoyer à la page (déjà fait côté content script), juste
      // refléter l'état pour que l'icône 🔒/🔓 reste synchronisée.
      set({ locked: message.locked })
      return
  }
}
