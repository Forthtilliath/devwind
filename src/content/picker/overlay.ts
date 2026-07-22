// Implémentation impérative (pas React) : le mousemove est un chemin chaud, on évite
// le coût d'un re-render React à chaque déplacement de souris.
export interface Overlay {
  show(rect: DOMRect, label: string): void
  hide(): void
  destroy(): void
}

export function createOverlay(container: ShadowRoot): Overlay {
  const box = document.createElement('div')
  box.className = 'devwind-overlay-box'

  const label = document.createElement('div')
  label.className = 'devwind-overlay-label'

  container.appendChild(box)
  container.appendChild(label)

  return {
    show(rect, text) {
      box.style.display = 'block'
      box.style.top = `${rect.top}px`
      box.style.left = `${rect.left}px`
      box.style.width = `${rect.width}px`
      box.style.height = `${rect.height}px`

      label.style.display = 'block'
      label.textContent = text
      const labelTop = rect.top > 20 ? rect.top - 20 : rect.bottom + 2
      label.style.top = `${labelTop}px`
      label.style.left = `${rect.left}px`
    },
    hide() {
      box.style.display = 'none'
      label.style.display = 'none'
    },
    destroy() {
      box.remove()
      label.remove()
    },
  }
}
