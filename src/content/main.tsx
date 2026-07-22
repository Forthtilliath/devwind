import { createRoot } from 'react-dom/client'
import { mountShadowHost } from './shadow-mount'
import { createElementPicker } from './picker/elementPicker'
import Panel from '../panel/Panel'
import { useEditorStore } from '../panel/store/useEditorStore'
import type { PickerMessage, PickerState } from '../types'

const HOST_ID = 'devwind-root-host'

async function mount() {
  // Idempotent : si le popup ré-exécute le content script sur un onglet déjà monté
  // (double clic rapide, etc.), on ne remonte pas un second Shadow DOM.
  if (document.getElementById(HOST_ID)) return

  const { host, shadowRoot } = await mountShadowHost(HOST_ID)

  const appRoot = document.createElement('div')
  appRoot.id = 'app-root'
  shadowRoot.appendChild(appRoot)
  createRoot(appRoot).render(<Panel />)

  const picker = createElementPicker({
    shadowRoot,
    host,
    onSelect: (el) => {
      useEditorStore.getState().selectElement(el)
    },
  })

  chrome.runtime.onMessage.addListener((message: PickerMessage, _sender, sendResponse) => {
    const state = (): PickerState => ({ active: useEditorStore.getState().pickerActive })

    switch (message.type) {
      case 'DEVWIND_PING':
      case 'DEVWIND_GET_STATE':
        sendResponse(state())
        return true
      case 'DEVWIND_SET_ACTIVE': {
        useEditorStore.getState().setPickerActive(message.active)
        if (message.active) picker.start()
        else picker.stop()
        sendResponse(state())
        return true
      }
      default:
        return false
    }
  })
}

void mount()
