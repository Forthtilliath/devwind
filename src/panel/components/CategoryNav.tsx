import { useState } from 'react'
import { categoryGroups } from '../data'
import type { GeneratedClass } from '../../types'

interface ClassValueButtonProps {
  item: GeneratedClass
  isActive: boolean
  onClick: () => void
}

function ClassValueButton({ item, isActive, onClick }: ClassValueButtonProps) {
  const isColor = item.category === 'Couleurs'
  return (
    <button
      type="button"
      className={`devwind-value${isActive ? ' devwind-value--active' : ''}${isColor ? ' devwind-value--color' : ''}`}
      title={item.className}
      onClick={onClick}
    >
      {isColor && <span className="devwind-value__swatch" style={{ background: item.themeToken ?? undefined }} />}
      <span className="devwind-value__label">{item.className}</span>
    </button>
  )
}

interface CategoryNavProps {
  activeClasses: string[]
  onApply: (item: GeneratedClass) => void
}

/**
 * Rail de catégories avec sous-catégories en disclosure progressive (accordéon fermé
 * sauf sections ayant des classes actives) — cf. plan section 2.
 */
export default function CategoryNav({ activeClasses, onApply }: CategoryNavProps) {
  const [activeCategory, setActiveCategory] = useState(categoryGroups[0]?.name ?? '')
  const group = categoryGroups.find((g) => g.name === activeCategory)

  return (
    <div className="devwind-category-nav">
      <div className="devwind-category-nav__rail">
        {categoryGroups.map((g) => (
          <button
            key={g.name}
            type="button"
            className={`devwind-category-nav__tab${g.name === activeCategory ? ' devwind-category-nav__tab--active' : ''}`}
            onClick={() => setActiveCategory(g.name)}
          >
            {g.name}
          </button>
        ))}
      </div>
      <div className="devwind-category-nav__content">
        {group?.subcategories.map((sub) => (
          <details key={sub.name} open={sub.classes.some((c) => activeClasses.some((ac) => ac.endsWith(c.className)))}>
            <summary>{sub.name}</summary>
            <div className="devwind-value-grid">
              {sub.classes.map((item) => (
                <ClassValueButton
                  key={item.className}
                  item={item}
                  isActive={activeClasses.includes(item.className)}
                  onClick={() => onApply(item)}
                />
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
