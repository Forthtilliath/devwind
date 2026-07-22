interface ClassChipProps {
  rawClass: string
  onRemove: (rawClass: string) => void
}

/** Chip d'une classe active sur l'élément sélectionné, avec ses badges de variant. */
export default function ClassChip({ rawClass, onRemove }: ClassChipProps) {
  const parts = rawClass.split(':')
  const base = parts.at(-1)!
  const variants = parts.slice(0, -1)

  return (
    <span className="devwind-chip">
      {variants.map((v) => (
        <span key={v} className="devwind-chip__variant">
          {v}
        </span>
      ))}
      <span className="devwind-chip__base">{base}</span>
      <button
        type="button"
        className="devwind-chip__remove"
        aria-label={`Retirer ${rawClass}`}
        onClick={() => onRemove(rawClass)}
      >
        ×
      </button>
    </span>
  )
}
