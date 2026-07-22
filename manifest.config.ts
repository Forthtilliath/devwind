import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

export default defineManifest({
  manifest_version: 3,
  name: 'DevWind',
  version: pkg.version,
  description: 'Éditeur visuel de classes Tailwind CSS, en direct dans le navigateur.',
  action: {
    default_popup: 'src/popup/popup.html',
  },
  background: {
    service_worker: 'src/background/service-worker.ts',
    type: 'module',
  },
  commands: {
    'toggle-picker': {
      suggested_key: { default: 'Ctrl+Shift+K', mac: 'Command+Shift+K' },
      description: 'Activer/désactiver le picker DevWind',
    },
  },
  permissions: ['activeTab', 'scripting', 'storage'],
  // Pas de content_scripts statique ni de host_permissions au repos : le content script
  // (dist/content/main.js, cf. vite.config.ts) est injecté à la demande via
  // chrome.scripting.executeScript depuis le popup (voir src/popup/Popup.tsx), déclenché
  // par le geste utilisateur sur l'icône (active `activeTab`). executeScript lui-même est un
  // appel privilégié, pas une requête depuis la page. En revanche panel.css est chargé via
  // fetch(chrome.runtime.getURL(...)) DEPUIS le content script une fois injecté (voir
  // src/content/shadow-mount.ts) : ce fetch est traité comme une requête "page" par Chrome
  // et nécessite donc d'être listé ici, même si techniquement émis par notre propre code.
  web_accessible_resources: [
    {
      resources: ['panel.css'],
      matches: ['<all_urls>'],
    },
  ],
})
