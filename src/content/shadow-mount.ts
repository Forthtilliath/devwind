export interface ShadowMount {
  host: HTMLDivElement
  shadowRoot: ShadowRoot
}

/**
 * Monte le host Shadow DOM sur `documentElement` (pas `body`, pour éviter les
 * `overflow`/`position` custom de certains sites). `pointer-events: none` par défaut :
 * seuls les éléments internes qui en ont besoin (le panneau) le réactivent, pour ne
 * jamais bloquer les interactions normales avec la page hors de notre UI.
 */
export async function mountShadowHost(hostId: string): Promise<ShadowMount> {
  const host = document.createElement('div')
  host.id = hostId
  host.style.cssText = 'all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;'
  document.documentElement.appendChild(host)

  const shadowRoot = host.attachShadow({ mode: 'open' })

  // Le Shadow DOM bloque nativement les collisions de sélecteurs dans les deux sens,
  // mais pas l'héritage CSS (font-family, color, line-height traversent la frontière) :
  // reset explicite en plus de l'inline posé sur le host.
  const resetStyle = document.createElement('style')
  resetStyle.textContent = ':host { all: initial; }'
  shadowRoot.appendChild(resetStyle)

  // CSS de l'extension chargé manuellement via adoptedStyleSheets plutôt que de laisser
  // Vite/CRXJS injecter un <link> global dans le <head> de la page (comportement par
  // défaut pour un import CSS depuis un content script, qu'on ne veut pas ici).
  try {
    const res = await fetch(chrome.runtime.getURL('panel.css'))
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(await res.text())
    shadowRoot.adoptedStyleSheets = [sheet]
  } catch (err) {
    console.error('[DevWind] échec du chargement des styles du panneau', err)
  }

  return { host, shadowRoot }
}
