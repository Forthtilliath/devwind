import type { PickerState } from '../types'

// Chemin de sortie stable configuré dans vite.content.config.ts : à garder synchronisé.
const CONTENT_SCRIPT_FILE = 'content/main.js'

async function pingContentScript(tabId: number): Promise<PickerState | undefined> {
  try {
    return await chrome.tabs.sendMessage(tabId, { type: 'DEVWIND_PING' })
  } catch {
    // Pas de listener côté content script (pas encore injecté dans cet onglet).
    return undefined
  }
}

export async function getDevWindState(tabId: number): Promise<PickerState> {
  return (await pingContentScript(tabId)) ?? { active: false }
}

/** Injecte le content script si besoin (idempotent), puis bascule l'état actif/inactif. */
export async function toggleDevWind(tabId: number): Promise<PickerState> {
  const current = await pingContentScript(tabId)
  if (!current) {
    await chrome.scripting.executeScript({ target: { tabId }, files: [CONTENT_SCRIPT_FILE] })
  }
  const next = !(current?.active ?? false)
  const result = await chrome.tabs.sendMessage(tabId, { type: 'DEVWIND_SET_ACTIVE', active: next })
  return result
}
