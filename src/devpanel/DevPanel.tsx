import { useDevPanelStore } from './store/useDevPanelStore'
import ClassChip from './components/ClassChip'
import SearchBar from './components/SearchBar'
import CategoryNav from './components/CategoryNav'
import CustomClassesSection from './components/CustomClassesSection'
import VariantToolbar from './components/VariantToolbar'
import { searchClasses } from './data'
import type { GeneratedClass } from '../types'

function arbitraryClassName(prefix: string, value: string): string {
  return prefix === '' ? `[${value}]` : `${prefix}-[${value}]`
}

export default function DevPanel() {
  const connectionState = useDevPanelStore((s) => s.connectionState)
  const tagName = useDevPanelStore((s) => s.tagName)
  const activeClasses = useDevPanelStore((s) => s.activeClasses)
  const search = useDevPanelStore((s) => s.search)
  const setSearch = useDevPanelStore((s) => s.setSearch)
  const applyChange = useDevPanelStore((s) => s.applyChange)
  const removeClass = useDevPanelStore((s) => s.removeClass)
  const activeVariants = useDevPanelStore((s) => s.activeVariants)
  const toggleVariant = useDevPanelStore((s) => s.toggleVariant)

  if (connectionState === 'disconnected') {
    return (
      <div className="devwind-panel devwind-panel--empty">
        <p>Page fermée ou rechargée — tu peux fermer cette fenêtre.</p>
      </div>
    )
  }

  const searchResults = search.trim() ? searchClasses(search) : []
  const searchActiveName = (className: string) => [...activeVariants, className].join(':')

  function applyItem(item: GeneratedClass) {
    applyChange({ taxonomyId: item.taxonomyId, prefix: item.prefix, variants: activeVariants, newBase: item.className })
  }

  function applyArbitrary(taxonomyId: string, prefix: string, value: string) {
    applyChange({ taxonomyId, prefix, variants: activeVariants, newBase: arbitraryClassName(prefix, value) })
  }

  return (
    <div className="devwind-panel">
      <header className="devwind-panel__header">
        <span className="devwind-panel__title">DevWind</span>
        {tagName && (
          <span className="devwind-panel__count">
            &lt;{tagName}&gt; · {activeClasses.length} classes
          </span>
        )}
      </header>

      {!tagName ? (
        <p className="devwind-hint">Clique sur un élément de la page pour éditer ses classes.</p>
      ) : (
        <>
          <VariantToolbar activeVariants={activeVariants} onToggle={toggleVariant} />
          <SearchBar value={search} onChange={setSearch} />

          {searchResults.length > 0 ? (
            <div className="devwind-value-grid devwind-search-results">
              {searchResults.slice(0, 60).map((item) => (
                <button
                  key={item.className}
                  type="button"
                  className={`devwind-value${activeClasses.includes(searchActiveName(item.className)) ? ' devwind-value--active' : ''}${item.category === 'Couleurs' ? ' devwind-value--color' : ''}`}
                  title={`${item.category} / ${item.subcategory ?? ''}`}
                  onClick={() => applyItem(item)}
                >
                  {item.category === 'Couleurs' && (
                    <span className="devwind-value__swatch" style={{ background: item.themeToken ?? undefined }} />
                  )}
                  <span className="devwind-value__label">{item.className}</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <section className="devwind-panel__chips">
                {activeClasses.length === 0 ? (
                  <p className="devwind-empty">Aucune classe sur cet élément.</p>
                ) : (
                  activeClasses.map((c) => <ClassChip key={c} rawClass={c} onRemove={removeClass} />)
                )}
              </section>

              <CategoryNav
                activeClasses={activeClasses}
                variants={activeVariants}
                onApply={applyItem}
                onApplyArbitrary={applyArbitrary}
              />

              <CustomClassesSection activeClasses={activeClasses} />
            </>
          )}
        </>
      )}
    </div>
  )
}
