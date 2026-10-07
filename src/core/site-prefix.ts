import { matchTaxonomy } from './class-parser'
import type { PrefixCandidate } from '../types'

/**
 * Côté panneau, fin de la détection heuristique du préfixe de site : parmi les candidats
 * collectés par la page (cf. prefix-candidates.ts), seuls comptent ceux dont la base est une
 * vraie classe Tailwind. Le préfixe le plus fréquent est retenu à partir de 3 occurrences.
 */
export function pickSitePrefix(candidates: PrefixCandidate[]): string | null {
  const totals = new Map<string, number>()
  for (const [prefix, base, count] of candidates) {
    if (matchTaxonomy(base) === null) continue
    totals.set(prefix, (totals.get(prefix) ?? 0) + count)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [prefix, count] of totals) {
    if (count > bestCount) {
      best = prefix
      bestCount = count
    }
  }
  return bestCount >= 3 ? best : null
}
