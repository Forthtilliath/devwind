import { useEffect, useState } from 'react'
import { useDevPanelStore } from '../store/useDevPanelStore'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import { useT } from '../i18n/useT'

/** Variables de thème Tailwind v4 (`--color-*`, `--radius-*`...) réellement définies sur
 * `:root` du site — indépendant de l'élément sélectionné, sert juste à inspecter le vrai
 * thème du site (utile pour comprendre pourquoi une classe rendue diffère de notre aperçu par
 * défaut, cf. `live-style.ts` qui référence ces mêmes variables avec fallback). */
export default function ThemeVariablesSection() {
  const t = useT()
  const themeVariables = useDevPanelStore((s) => s.themeVariables)
  const runThemeScan = useDevPanelStore((s) => s.runThemeScan)
  const [filter, setFilter] = useState('')
  const { copied: copiedName, copy } = useCopyToClipboard()

  useEffect(() => {
    runThemeScan()
  }, [runThemeScan])

  if (!themeVariables) return null

  const query = filter.trim().toLowerCase()
  const visible = query ? themeVariables.filter((v) => v.name.toLowerCase().includes(query)) : themeVariables

  return (
    <details className="devwind-custom-section">
      <summary>{t('themeVars.summary', { count: themeVariables.length })}</summary>
      {themeVariables.length > 0 && (
        <input
          type="text"
          className="devwind-theme-vars__filter"
          placeholder={t('themeVars.filter')}
          aria-label={t('themeVars.filterLabel')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      )}
      <div className="devwind-theme-vars__list">
        {visible.map((v) => (
          <button
            key={v.name}
            type="button"
            className="devwind-theme-vars__row"
            title={t('themeVars.copyTitle', { name: v.name })}
            onClick={() => void copy(`var(${v.name})`, v.name)}
          >
            {v.name.includes('-color-') && <span className="devwind-value__swatch" aria-hidden="true" style={{ background: v.value }} />}
            <span className="devwind-theme-vars__name">{v.name}</span>
            <span className="devwind-theme-vars__value">{copiedName === v.name ? t('themeVars.copied') : v.value}</span>
          </button>
        ))}
        {themeVariables.length === 0 && <p className="devwind-empty">{t('themeVars.empty')}</p>}
      </div>
    </details>
  )
}
