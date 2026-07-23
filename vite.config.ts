import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config.ts'

// Build principal : background géré par CRXJS à partir du manifest, devpanel ajouté
// manuellement comme entrée HTML supplémentaire (chargée via chrome.windows.create, supporte
// les modules ES normalement — contrairement au content script, buildé séparément en IIFE,
// voir vite.content.config.ts, car injecté via chrome.scripting.executeScript).
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  server: {
    // Requis par CRXJS en dev : le service worker doit pouvoir joindre le serveur HMR.
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        devpanel: fileURLToPath(new URL('./src/devpanel/devpanel.html', import.meta.url)),
      },
    },
  },
})
