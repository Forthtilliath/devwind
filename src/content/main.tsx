import { mountShadowHost } from './shadow-mount'
import { createElementPicker } from './picker/elementPicker'
import { selectElement, setupSync } from './sync'
import type { PickerMessage, PickerState } from '../types'

const HOST_ID = 'devwind-root-host'

function mount() {
  // Idempotent : si le popup ré-exécute le content script sur un onglet déjà monté
  // (double clic rapide, etc.), on ne remonte pas un second Shadow DOM.
  if (document.getElementById(HOST_ID)) return

  const { host, shadowRoot } = mountShadowHost(HOST_ID)

  let pickerActive = false

  const picker = createElementPicker({
    shadowRoot,
    host,
    onSelect: (el) => selectElement(el),
  })

  setupSync({
    onPortConnected: () => {
      // La fenêtre devpanel vient de se connecter : rien à faire de spécial ici, le picker
      // est démarré/arrêté via DEVWIND_SET_ACTIVE (déclenché par core/activation.ts au moment
      // de l'ouverture de la fenêtre), pas par la connexion du port elle-même.
    },
    onPortDisconnected: () => {
      // Fenêtre devpanel fermée : plus personne pour éditer, on arrête le picker.
      pickerActive = false
      picker.stop()
    },
  })

  chrome.runtime.onMessage.addListener((message: PickerMessage, _sender, sendResponse) => {
    const state = (): PickerState => ({ active: pickerActive })

    switch (message.type) {
      case 'DEVWIND_PING':
      case 'DEVWIND_GET_STATE':
        sendResponse(state())
        return true
      case 'DEVWIND_SET_ACTIVE': {
        pickerActive = message.active
        if (pickerActive) picker.start()
        else picker.stop()
        sendResponse(state())
        return true
      }
      default:
        return false
    }
  })
}

mount()
