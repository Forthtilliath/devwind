import { toggleDevPanel } from '../core/activation'

chrome.runtime.onInstalled.addListener(() => {
  console.log('[DevWind] extension installée')
})

// Clic sur l'icône : ouvre/ferme directement la fenêtre devpanel (plus de popup intermédiaire).
chrome.action.onClicked.addListener((tab) => {
  if (tab.id != null) void toggleDevPanel(tab.id)
})

// Raccourci clavier (Ctrl+Shift+K) : même bascule, geste utilisateur qualifiant pour activeTab
// au même titre qu'un clic sur l'icône.
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'toggle-picker' && tab?.id != null) void toggleDevPanel(tab.id)
})
