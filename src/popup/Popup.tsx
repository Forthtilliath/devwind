import { useEffect, useState } from 'react'
import { getDevWindState, toggleDevWind } from '../core/activation'

async function getActiveTabId(): Promise<number | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab?.id ?? null
}

export default function Popup() {
  const [tabId, setTabId] = useState<number | null>(null)
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      const id = await getActiveTabId()
      setTabId(id)
      if (id != null) {
        const state = await getDevWindState(id)
        setActive(state.active)
      }
      setLoading(false)
    })()
  }, [])

  async function handleToggle() {
    if (tabId == null) return
    setLoading(true)
    const state = await toggleDevWind(tabId)
    setActive(state.active)
    setLoading(false)
  }

  return (
    <div className="devwind-popup">
      <h1>DevWind</h1>
      <p className="devwind-popup__subtitle">Éditeur visuel de classes Tailwind</p>
      <button
        type="button"
        className={`devwind-popup__toggle${active ? ' devwind-popup__toggle--active' : ''}`}
        onClick={handleToggle}
        disabled={loading || tabId == null}
      >
        {active ? 'Désactiver le picker' : 'Activer le picker'}
      </button>
      <p className="devwind-popup__shortcut">Raccourci : Ctrl+Shift+K</p>
    </div>
  )
}
