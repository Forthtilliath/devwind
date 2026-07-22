import { toggleDevWind } from '../core/activation'

chrome.runtime.onInstalled.addListener(() => {
  console.log('[DevWind] extension installée')
})

// Raccourci clavier (Ctrl+Shift+K) : geste utilisateur qualifiant pour activeTab au même
// titre qu'un clic sur l'icône, donc utilisable même sans passer par le popup.
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'toggle-picker' && tab?.id != null) {
    void toggleDevWind(tab.id)
  }
})
