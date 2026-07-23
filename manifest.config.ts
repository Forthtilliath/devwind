import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json' with { type: 'json' }

export default defineManifest({
  manifest_version: 3,
  name: 'DevWind',
  version: pkg.version,
  description: 'Éditeur visuel de classes Tailwind CSS, en direct dans le navigateur.',
  action: {
    // Pas de default_popup : le clic sur l'icône ouvre/ferme directement la fenêtre devpanel
    // (voir src/background/service-worker.ts), un mini-popup intermédiaire n'a plus lieu
    // d'être maintenant que le panneau est une vraie fenêtre de navigateur séparée.
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
  // (dist/content/main.js, cf. vite.content.config.ts) est injecté à la demande via
  // chrome.scripting.executeScript (voir src/core/activation.ts), déclenché par le geste
  // utilisateur sur l'icône ou le raccourci clavier (active `activeTab`).
})
