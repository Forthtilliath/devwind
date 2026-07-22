import { useEditorStore } from './store/useEditorStore'
import ClassChip from './components/ClassChip'
import SearchBar from './components/SearchBar'
import CategoryNav from './components/CategoryNav'
import CustomClassesSection from './components/CustomClassesSection'
import { searchClasses } from './data'
import type { ClassChangeRequest } from '../core/class-diff'
import type { GeneratedClass } from '../types'

function applyRequestFor(item: GeneratedClass): ClassChangeRequest {
  return { taxonomyId: item.taxonomyId, variants: [], newBase: item.className }
}

export default function Panel() {
  const pickerActive = useEditorStore((s) => s.pickerActive)
  const selectedElementId = useEditorStore((s) => s.selectedElementId)
  const activeClasses = useEditorStore((s) => s.activeClasses)
  const search = useEditorStore((s) => s.search)
  const setSearch = useEditorStore((s) => s.setSearch)
  const applyChange = useEditorStore((s) => s.applyChange)
  const removeClass = useEditorStore((s) => s.removeClass)

  if (!pickerActive) return null

  const searchResults = search.trim() ? searchClasses(search) : []

  return (
    <div className="devwind-panel">
      <header className="devwind-panel__header">
        <span className="devwind-panel__title">DevWind</span>
        {selectedElementId != null && <span className="devwind-panel__count">{activeClasses.length} classes</span>}
      </header>

      {selectedElementId == null ? (
        <p className="devwind-hint">Cliquez sur un élément de la page pour éditer ses classes.</p>
      ) : (
        <>
          <SearchBar value={search} onChange={setSearch} />

          {searchResults.length > 0 ? (
            <div className="devwind-value-grid devwind-search-results">
              {searchResults.slice(0, 60).map((item) => (
                <button
                  key={item.className}
                  type="button"
                  className={`devwind-value${activeClasses.includes(item.className) ? ' devwind-value--active' : ''}${item.category === 'Couleurs' ? ' devwind-value--color' : ''}`}
                  title={`${item.category} / ${item.subcategory ?? ''}`}
                  onClick={() => applyChange(applyRequestFor(item))}
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

              <CategoryNav activeClasses={activeClasses} onApply={(item) => applyChange(applyRequestFor(item))} />

              <CustomClassesSection activeClasses={activeClasses} />
            </>
          )}
        </>
      )}
    </div>
  )
}
