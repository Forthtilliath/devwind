import { useState } from 'react'
import { categoryGroups } from '../data'
import { taxonomy } from '../../data/taxonomy'
import PropertyRow from './PropertyRow'
import type { GeneratedClass } from '../../types'

interface CategoryNavProps {
  activeClasses: string[]
  variants: string[]
  onApply: (item: GeneratedClass) => void
  onApplyArbitrary: (taxonomyId: string, prefix: string, value: string) => void
}

/** Rail de catégories ; le contenu de chaque catégorie est une liste de PropertyRow
 * (une ligne compacte par propriété) plutôt que des grilles exhaustives dépliées. */
export default function CategoryNav({ activeClasses, variants, onApply, onApplyArbitrary }: CategoryNavProps) {
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
        {group?.subcategories.map((sub) => {
          const entry = taxonomy.find((e) => e.id === sub.classes[0]?.taxonomyId)
          if (!entry) return null
          return (
            <PropertyRow
              key={sub.name}
              entry={entry}
              classes={sub.classes}
              activeClasses={activeClasses}
              variants={variants}
              onApply={onApply}
              onApplyArbitrary={(prefix, value) => onApplyArbitrary(entry.id, prefix, value)}
            />
          )
        })}
      </div>
    </div>
  )
}
