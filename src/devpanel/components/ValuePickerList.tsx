import { useState } from 'react'
import type { GeneratedClass } from '../../types'

interface ArbitraryConfig {
  placeholder: string
  onSubmit: (value: string) => void
}

interface ValuePickerListProps {
  items: GeneratedClass[]
  showSwatch: boolean
  activeClassName: string | null
  labelFor: (item: GeneratedClass) => string
  onPick: (item: GeneratedClass) => void
  arbitrary?: ArbitraryConfig
}

/**
 * Un seul composant de liste recherchable réutilisé pour les entrées `scale` ET `color` :
 * la recherche règle déjà le problème d'un mur de valeurs (taper "red" ou "500" filtre
 * instantanément un mur de 242 couleurs) — pas besoin de deux composants dédiés bespoke.
 */
export default function ValuePickerList({ items, showSwatch, activeClassName, labelFor, onPick, arbitrary }: ValuePickerListProps) {
  const [query, setQuery] = useState('')
  const [arbitraryValue, setArbitraryValue] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = q ? items.filter((i) => i.className.toLowerCase().includes(q)) : items

  return (
    <div className="devwind-vpl">
      <input
        autoFocus
        type="text"
        className="devwind-vpl__search"
        placeholder="Rechercher…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="devwind-vpl__list">
        {filtered.map((item) => (
          <button
            key={item.className}
            type="button"
            className={`devwind-vpl__row${item.className === activeClassName ? ' devwind-vpl__row--active' : ''}`}
            onClick={() => onPick(item)}
          >
            {showSwatch && <span className="devwind-vpl__swatch" style={{ background: item.themeToken ?? undefined }} />}
            <span className="devwind-vpl__name">{labelFor(item)}</span>
            {!showSwatch && item.themeToken && <span className="devwind-vpl__token">{item.themeToken}</span>}
          </button>
        ))}
        {filtered.length === 0 && <p className="devwind-vpl__empty">Aucun résultat</p>}
      </div>
      {arbitrary && (
        <form
          className="devwind-vpl__arbitrary"
          onSubmit={(e) => {
            e.preventDefault()
            const v = arbitraryValue.trim()
            if (v) arbitrary.onSubmit(v)
          }}
        >
          <input
            type="text"
            placeholder={arbitrary.placeholder}
            value={arbitraryValue}
            onChange={(e) => setArbitraryValue(e.target.value)}
          />
          <button type="submit">OK</button>
        </form>
      )}
    </div>
  )
}
