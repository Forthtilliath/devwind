import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.config.ts'

// Build principal : popup + background, gérés par CRXJS à partir du manifest.
// Le content script (src/content/main.tsx) est buildé séparément, voir vite.content.config.ts.
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  server: {
    // Requis par CRXJS en dev : le service worker doit pouvoir joindre le serveur HMR.
    port: 5173,
    strictPort: true,
  },
})
