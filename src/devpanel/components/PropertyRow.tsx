import { useState } from 'react'
import Popover from './Popover'
import ValuePickerList from './ValuePickerList'
import type { GeneratedClass, TaxonomyEntry } from '../../types'

interface PropertyRowProps {
  entry: TaxonomyEntry
  classes: GeneratedClass[]
  activeClasses: string[]
  onApply: (item: GeneratedClass) => void
  onApplyArbitrary: (prefix: string, value: string) => void
}

function formatSuffix(item: GeneratedClass): string {
  const withoutSign = item.negative ? item.className.slice(1) : item.className
  const suffix = item.prefix ? withoutSign.slice(item.prefix.length + 1) : withoutSign
  return item.negative ? `-${suffix}` : suffix
}

/**
 * Une ligne compacte par propriété (ex. "Background", "Padding") au lieu d'une grille
 * exhaustive toujours dépliée : affiche la valeur active courante, un clic ouvre un popover
 * recherchable pour la changer. Entrées `static` (peu de valeurs) : pills inline, pas de
 * popover — déjà compact avec ≤10 valeurs.
 */
export default function PropertyRow({ entry, classes, activeClasses, onApply, onApplyArbitrary }: PropertyRowProps) {
  const prefixes = entry.prefixes
  const [activePrefix, setActivePrefix] = useState(prefixes[0])

  if (entry.type === 'static') {
    return (
      <div className="devwind-row">
        <span className="devwind-row__label">{entry.subcategory}</span>
        <div className="devwind-row__pills">
          {classes.map((item) => (
            <button
              key={item.className}
              type="button"
              className={`devwind-pill${activeClasses.includes(item.className) ? ' devwind-pill--active' : ''}`}
              onClick={() => onApply(item)}
            >
              {formatSuffix(item) || item.className}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const itemsForPrefix = classes.filter((c) => c.prefix === activePrefix)
  const activeItem = itemsForPrefix.find((c) => activeClasses.includes(c.className)) ?? null
  const isColor = entry.type === 'color'

  return (
    <div className="devwind-row">
      <span className="devwind-row__label">{entry.subcategory}</span>

      {prefixes.length > 1 && (
        <div className="devwind-row__sides">
          {prefixes.map((p) => (
            <button
              key={p}
              type="button"
              className={`devwind-side${p === activePrefix ? ' devwind-side--active' : ''}`}
              onClick={() => setActivePrefix(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <Popover
        triggerClassName={activeItem ? 'devwind-popover__trigger--set' : ''}
        label={
          <>
            {isColor && (
              <span
                className="devwind-value__swatch"
                style={{ background: activeItem?.themeToken ?? 'transparent' }}
              />
            )}
            <span>{activeItem ? formatSuffix(activeItem) : '—'}</span>
          </>
        }
      >
        {(close) => (
          <ValuePickerList
            items={itemsForPrefix}
            showSwatch={isColor}
            activeClassName={activeItem?.className ?? null}
            labelFor={formatSuffix}
            onPick={(item) => {
              onApply(item)
              close()
            }}
            arbitrary={
              entry.supportsArbitrary
                ? {
                    placeholder: isColor ? '#hex ou css…' : 'valeur css…',
                    onSubmit: (value) => {
                      onApplyArbitrary(activePrefix, value)
                      close()
                    },
                  }
                : undefined
            }
          />
        )}
      </Popover>
    </div>
  )
}
